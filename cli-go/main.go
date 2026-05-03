package main

import (
	"fmt"
	"os"
	"strconv"

	"github.com/spf13/cobra"
)

func main() {
	var (
		linearAPIKey string
		githubToken  string
		githubOwner  string
		githubRepo   string
		linearTeamID string
		delay        string
	)

	transferCmd := &cobra.Command{
		Use:   "transfer",
		Short: "Transfer all Linear issues to a GitHub repository",
		RunE: func(cmd *cobra.Command, args []string) error {
			if linearAPIKey == "" {
				return fmt.Errorf("--linear-api-key is required (or set LINEAR_API_KEY env var)")
			}
			if githubToken == "" {
				return fmt.Errorf("--github-token is required (or set GITHUB_TOKEN env var)")
			}
			if githubOwner == "" {
				return fmt.Errorf("--github-owner is required (or set GITHUB_OWNER env var)")
			}
			if githubRepo == "" {
				return fmt.Errorf("--github-repo is required (or set GITHUB_REPO env var)")
			}

			delayMs, err := strconv.Atoi(delay)
			if err != nil {
				return fmt.Errorf("invalid --delay value: %s", delay)
			}

			fmt.Println("Starting transfer of Linear issues to GitHub...")
			fmt.Printf("  GitHub repository: %s/%s\n", githubOwner, githubRepo)
			if linearTeamID != "" {
				fmt.Printf("  Linear team ID: %s\n", linearTeamID)
			}
			fmt.Println()

			summary, err := transferIssues(TransferOptions{
				LinearAPIKey: linearAPIKey,
				GitHubToken:  githubToken,
				GitHubOwner:  githubOwner,
				GitHubRepo:   githubRepo,
				LinearTeamID: linearTeamID,
				DelayMs:      delayMs,
			}, func(current, total int, issue LinearIssue) {
				fmt.Printf("[%d/%d] Transferring: %s - %s\n", current, total, issue.ID, issue.Title)
			})
			if err != nil {
				return err
			}

			fmt.Println()
			fmt.Println("Transfer complete!")
			fmt.Printf("  Total issues: %d\n", summary.Total)
			fmt.Printf("  Successfully transferred: %d\n", summary.Transferred)
			fmt.Printf("  Failed: %d\n", summary.Failed)

			if len(summary.Errors) > 0 {
				fmt.Println()
				fmt.Println("Failed issues:")
				for _, e := range summary.Errors {
					fmt.Fprintf(os.Stderr, "  %s - %s: %s\n", e.Issue.ID, e.Issue.Title, e.Err)
				}
				os.Exit(1)
			}

			return nil
		},
	}

	transferCmd.Flags().StringVar(&linearAPIKey, "linear-api-key", os.Getenv("LINEAR_API_KEY"), "Linear API key")
	transferCmd.Flags().StringVar(&githubToken, "github-token", os.Getenv("GITHUB_TOKEN"), "GitHub personal access token")
	transferCmd.Flags().StringVar(&githubOwner, "github-owner", os.Getenv("GITHUB_OWNER"), "GitHub repository owner (user or organization)")
	transferCmd.Flags().StringVar(&githubRepo, "github-repo", os.Getenv("GITHUB_REPO"), "GitHub repository name")
	transferCmd.Flags().StringVar(&linearTeamID, "linear-team-id", os.Getenv("LINEAR_TEAM_ID"), "Linear team ID to filter issues (optional)")
	transferCmd.Flags().StringVar(&delay, "delay", "1000", "Delay in milliseconds between GitHub API requests")

	rootCmd := &cobra.Command{
		Use:     "linear-to-github",
		Short:   "Transfer Linear issues to GitHub",
		Version: "1.0.0",
	}
	rootCmd.AddCommand(transferCmd)

	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
