package main

import (
	"context"
	"embed"
	"fmt"
	"sync"

	"linear-to-github/gui/backend/cli"
	"linear-to-github/gui/backend/transfer"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed extensions/*
var extensionFS embed.FS

// wailsEmitter adapts the Wails runtime EventsEmit function to the
// transfer.EventEmitter interface.
type wailsEmitter struct{ ctx context.Context }

func (e *wailsEmitter) Emit(event string, data any) {
	wailsRuntime.EventsEmit(e.ctx, event, data)
}

// App is the root Wails binding struct.
type App struct {
	ctx       context.Context
	extractor *cli.Extractor
	busy      bool
	mu        sync.Mutex
}

// NewApp creates a new App application struct.
func NewApp() *App { return &App{} }

// startup extracts the embedded CLI binary and saves the app context.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	ext, err := cli.Extract(extensionFS)
	if err != nil {
		wailsRuntime.LogErrorf(ctx, "failed to extract CLI: %v", err)
		return
	}
	a.extractor = ext
}

// shutdown cleans up the extracted CLI binary.
func (a *App) shutdown(_ context.Context) {
	if a.extractor != nil {
		a.extractor.Cleanup()
	}
}

// Transfer runs the embedded CLI and streams progress events to the frontend.
func (a *App) Transfer(opts transfer.Options) error {
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

	if a.extractor == nil {
		return fmt.Errorf("CLI binary could not be extracted — see application logs")
	}

	runner := transfer.NewRunner(a.extractor.CLIPath, &wailsEmitter{ctx: a.ctx})
	return runner.Run(a.ctx, opts)
}
