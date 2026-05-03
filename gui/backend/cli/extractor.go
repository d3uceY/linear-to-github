package cli

import (
	"embed"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
)

// Extractor extracts the correct platform CLI binary from an embedded FS
// to a temporary directory, ready to be executed.
type Extractor struct {
	tmpDir  string
	CLIPath string
}

// Extract reads the right binary for the current OS out of fs, writes it to a
// temp dir, marks it executable, and returns an Extractor. Call Cleanup when
// done to remove the temp dir.
func Extract(fs embed.FS) (*Extractor, error) {
	var name string
	switch runtime.GOOS {
	case "windows":
		name = "extensions/app-windows.exe"
	case "darwin":
		name = "extensions/app-macos"
	default:
		name = "extensions/app-linux"
	}

	data, err := fs.ReadFile(name)
	if err != nil {
		return nil, fmt.Errorf("read embedded CLI (%s): %w", name, err)
	}

	tmpDir, err := os.MkdirTemp("", "ltg-*")
	if err != nil {
		return nil, fmt.Errorf("create temp dir: %w", err)
	}

	ext := ""
	if runtime.GOOS == "windows" {
		ext = ".exe"
	}
	cliPath := filepath.Join(tmpDir, "linear-to-github"+ext)

	if err := os.WriteFile(cliPath, data, 0755); err != nil {
		os.RemoveAll(tmpDir)
		return nil, fmt.Errorf("write CLI binary: %w", err)
	}

	return &Extractor{tmpDir: tmpDir, CLIPath: cliPath}, nil
}

// Cleanup removes the temporary directory created by Extract.
func (e *Extractor) Cleanup() {
	if e.tmpDir != "" {
		os.RemoveAll(e.tmpDir)
	}
}
