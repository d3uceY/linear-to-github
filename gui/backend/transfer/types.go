package transfer

// Options mirrors the CLI flags passed to the transfer subcommand.
type Options struct {
	LinearAPIKey string `json:"linearApiKey"`
	GitHubToken  string `json:"githubToken"`
	GitHubOwner  string `json:"githubOwner"`
	GitHubRepo   string `json:"githubRepo"`
	LinearTeamID string `json:"linearTeamId"`
	DelayMs      int    `json:"delayMs"`
}

// ProgressEvent is emitted as each issue begins transferring.
type ProgressEvent struct {
	Current int    `json:"current"`
	Total   int    `json:"total"`
	ID      string `json:"id"`
	Title   string `json:"title"`
}

// ResultEvent is emitted when an individual issue succeeds or fails.
type ResultEvent struct {
	ID      string `json:"id"`
	Title   string `json:"title"`
	URL     string `json:"url"`
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}
