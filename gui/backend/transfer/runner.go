package transfer

import (
	"bufio"
	"context"
	"fmt"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
	"sync"
)

var (
	progressRe  = regexp.MustCompile(`^\[(\d+)/(\d+)\] Transferring: (\S+) - (.+)$`)
	createdRe   = regexp.MustCompile(`^\s+Created: (.+)$`)
	issueFailRe = regexp.MustCompile(`^\s+Failed: (.+)$`)
)

// EventEmitter is satisfied by the Wails runtime and any test double.
type EventEmitter interface {
	Emit(event string, data any)
}

// Runner executes the CLI binary and streams transfer events.
type Runner struct {
	cliPath string
	emitter EventEmitter
}

// NewRunner creates a Runner that will call cliPath and emit events through emitter.
func NewRunner(cliPath string, emitter EventEmitter) *Runner {
	return &Runner{cliPath: cliPath, emitter: emitter}
}

// Run invokes the transfer subcommand and blocks until it finishes.
// It emits:
//   - EventProgress ("transfer:progress") for each issue starting
//   - EventResult   ("transfer:result")   for each issue completing
//   - EventDone     ("transfer:done")     on completion (always)
//
// Returns a non-nil error only for fatal failures (bad binary path, auth
// errors reported on stderr, etc.). Individual issue failures are surfaced
// through EventResult, not as a returned error.
func (r *Runner) Run(ctx context.Context, opts Options) error {
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

	cmd := exec.CommandContext(ctx, r.cliPath, args...)

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

	// Drain stderr so its pipe buffer never fills.
	var stderrBuf strings.Builder
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		sc := bufio.NewScanner(stderr)
		for sc.Scan() {
			stderrBuf.WriteString(sc.Text() + "\n")
		}
	}()

	completedNormally := false
	inSummary := false
	var lastProgress ProgressEvent

	sc := bufio.NewScanner(stdout)
	for sc.Scan() {
		line := sc.Text()

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
			lastProgress = ProgressEvent{Current: current, Total: total, ID: m[3], Title: m[4]}
			r.emitter.Emit("transfer:progress", lastProgress)
		} else if m := createdRe.FindStringSubmatch(line); m != nil {
			r.emitter.Emit("transfer:result", ResultEvent{
				ID:      lastProgress.ID,
				Title:   lastProgress.Title,
				URL:     strings.TrimSpace(m[1]),
				Success: true,
			})
		} else if m := issueFailRe.FindStringSubmatch(line); m != nil {
			r.emitter.Emit("transfer:result", ResultEvent{
				ID:      lastProgress.ID,
				Title:   lastProgress.Title,
				Success: false,
				Error:   strings.TrimSpace(m[1]),
			})
		}
	}

	wg.Wait()
	cmdErr := cmd.Wait()
	r.emitter.Emit("transfer:done", nil)

	if cmdErr != nil && !completedNormally {
		if msg := strings.TrimSpace(stderrBuf.String()); msg != "" {
			return fmt.Errorf("%s", msg)
		}
		return cmdErr
	}
	return nil
}
