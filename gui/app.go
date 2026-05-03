package main

import (
	"bufio"
	"context"
	"embed"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"sync"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed extensions/*
var extensionFS embed.FS

// App struct
type App struct {
	ctx     context.Context
	cliPath string
	tmpDir  string
	busy    bool
	mu      sync.Mutex
}

// TransferOptions mirrors the CLI flags.
type TransferOptions struct {
	LinearAPIKey string `json:"linearApiKey"`
	GitHubToken  string `json:"githubToken"`
	GitHubOwner  string `json:"githubOwner"`
	GitHubRepo   string `json:"githubRepo"`
	LinearTeamID string `json:"linearTeamId"`
	DelayMs      int    `json:"delayMs"`
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	cliPath, tmpDir, err := extractCLI()
	if err != nil {
		wailsRuntime.LogErrorf(ctx, "failed to extract CLI: %v", err)
		return
	}
	a.cliPath = cliPath
	a.tmpDir = tmpDir
}

// shutdown cleans up the temp directory.
func (a *App) shutdown(_ context.Context) {
	if a.tmpDir != "" {
		os.RemoveAll(a.tmpDir)
	}
}

func extractCLI() (string, string, error) {
	var name string
	switch runtime.GOOS {
	case "windows":
		name = "extensions/app-windows.exe"
	case "darwin":
		name = "extensions/app-macos"
	default:
		name = "extensions/app-linux"
	}

	data, err := extensionFS.ReadFile(name)
	if err != nil {
		return "", "", fmt.Errorf("read embedded CLI: %w", err)
	}

	tmpDir, err := os.MkdirTemp("", "ltg-*")
	if err != nil {
		return "", "", err
	}

	ext := ""
	if runtime.GOOS == "windows" {
		ext = ".exe"
	}
	cliPath := filepath.Join(tmpDir, "linear-to-github"+ext)
	if err := os.WriteFile(cliPath, data, 0755); err != nil {
		os.RemoveAll(tmpDir)
		return "", "", err
	}
	return cliPath, tmpDir, nil
}

var (
	progressRe = regexp.MustCompile(`^\[(\d+)/(\d+)\] Transferring: (\S+) - (.+)$`)
	createdRe  = regexp.MustCompile(`^\s+Created: (.+)$`)
	issueFailRe = regexp.MustCompile(`^\s+Failed: (.+)$`)
)

// Transfer runs the embedded CLI binary and streams events to the frontend.
// Events emitted:
//   - "transfer:progress"  {current, total, id, title}
//   - "transfer:result"    {id, title, url, success, error?}
//   - "transfer:done"      nil  (always fires on completion)
func (a *App) Transfer(opts TransferOptions) error {
	a.mu.Lock()
	if a.busy {
		a.mu.Unlock()
		return fmt.Errorf("a transfer is already in progress")
	}
	a.busy = true
	a.mu.Unlock()
	defer func() {
		a.mu.Lock()
		a.busy = false
		a.mu.Unlock()
	}()

	if a.cliPath == "" {
		return fmt.Errorf("CLI binary could not be extracted — see application logs")
	}

	args := []string{
		"transfer",
		"--linear-api-key", opts.LinearAPIKey,
		"--github-token", opts.GitHubToken,
		"--github-owner", opts.GitHubOwner,
		"--github-repo", opts.GitHubRepo,
		"--delay", strconv.Itoa(opts.DelayMs),
	}
	if opts.LinearTeamID != "" {
		args = append(args, "--linear-team-id", opts.LinearTeamID)
	}

	cmd := exec.CommandContext(a.ctx, a.cliPath, args...)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return err
	}

	if err := cmd.Start(); err != nil {
		return err
	}

	// Drain stderr concurrently so its buffer never fills.
	var stderrBuf strings.Builder
	var stderrWg sync.WaitGroup
	stderrWg.Add(1)
	go func() {
		defer stderrWg.Done()
		sc := bufio.NewScanner(stderr)
		for sc.Scan() {
			stderrBuf.WriteString(sc.Text() + "\n")
		}
	}()

	type progressEvent struct {
		Current int    `json:"current"`
		Total   int    `json:"total"`
		ID      string `json:"id"`
		Title   string `json:"title"`
	}
	type resultEvent struct {
		ID      string `json:"id"`
		Title   string `json:"title"`
		URL     string `json:"url"`
		Success bool   `json:"success"`
		Error   string `json:"error,omitempty"`
	}

	var lastProgress progressEvent
	completedNormally := false
	inSummary := false

	sc := bufio.NewScanner(stdout)
	for sc.Scan() {
		line := sc.Text()
		wailsRuntime.EventsEmit(a.ctx, "transfer:log", line)

		if strings.TrimSpace(line) == "Transfer complete!" {
			completedNormally = true
			inSummary = true
			continue
		}
		if inSummary {
			continue
		}

		if m := progressRe.FindStringSubmatch(line); m != nil {
			current, _ := strconv.Atoi(m[1])
			total, _ := strconv.Atoi(m[2])
			lastProgress = progressEvent{Current: current, Total: total, ID: m[3], Title: m[4]}
			wailsRuntime.EventsEmit(a.ctx, "transfer:progress", lastProgress)
		} else if m := createdRe.FindStringSubmatch(line); m != nil {
			wailsRuntime.EventsEmit(a.ctx, "transfer:result", resultEvent{
				ID:      lastProgress.ID,
				Title:   lastProgress.Title,
				URL:     strings.TrimSpace(m[1]),
				Success: true,
			})
		} else if m := issueFailRe.FindStringSubmatch(line); m != nil {
			wailsRuntime.EventsEmit(a.ctx, "transfer:result", resultEvent{
				ID:      lastProgress.ID,
				Title:   lastProgress.Title,
				Success: false,
				Error:   strings.TrimSpace(m[1]),
			})
		}
	}

	stderrWg.Wait()
	cmdErr := cmd.Wait()
	wailsRuntime.EventsEmit(a.ctx, "transfer:done", nil)

	// Only surface a fatal error when the process never reached "Transfer complete!".
	// Individual issue failures cause exit code 1 but are surfaced via events.
	if cmdErr != nil && !completedNormally {
		if msg := strings.TrimSpace(stderrBuf.String()); msg != "" {
			return fmt.Errorf("%s", msg)
		}
		return cmdErr
	}
	return nil
}
