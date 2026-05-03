package main

import (
	"context"
	"fmt"
	"time"
)

type TransferOptions struct {
	LinearAPIKey string
	GitHubToken  string
	GitHubOwner  string
	GitHubRepo   string
	LinearTeamID string
	DelayMs      int
}


type TransferResult struct {
	LinearIssue LinearIssue
	GitHubIssue GitHubIssue
}


type TransferError struct {
	Issue LinearIssue
	Err   string
}

type TransferSummary struct {
	Total       int
	Transferred int
	Failed      int
	Results     []TransferResult
	Errors      []TransferError
}

func transferIssues(opts TransferOptions, onProgress func(current, total int, issue LinearIssue)) (*TransferSummary, error) {
	fmt.Println("Fetching Linear issues...")
	issues, err := fetchLinearIssues(opts.LinearAPIKey, opts.LinearTeamID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch Linear issues: %w", err)
	}
	fmt.Printf("Found %d issues. Starting transfer...\n", len(issues))

	ctx := context.Background()
	summary := &TransferSummary{Total: len(issues)}

	for i, issue := range issues {
		if onProgress != nil {
			onProgress(i+1, len(issues), issue)
		}

		ghIssue, err := createGitHubIssue(ctx, opts.GitHubToken, opts.GitHubOwner, opts.GitHubRepo, issue)
		if err != nil {
			fmt.Printf("  Failed: %v\n", err)
			summary.Failed++
			summary.Errors = append(summary.Errors, TransferError{Issue: issue, Err: err.Error()})
		} else {
			fmt.Printf("  Created: %s\n", ghIssue.URL)
			summary.Transferred++
			summary.Results = append(summary.Results, TransferResult{LinearIssue: issue, GitHubIssue: *ghIssue})
		}

		if i < len(issues)-1 && opts.DelayMs > 0 {
			time.Sleep(time.Duration(opts.DelayMs) * time.Millisecond)
		}
	}

	return summary, nil
}
