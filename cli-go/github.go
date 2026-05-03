package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

var priorityLabels = map[int]string{
	1: "urgent",
	2: "high",
	3: "medium",
	4: "low",
}

// GitHubIssue holds the result of a created GitHub issue.
type GitHubIssue struct {
	Number int
	URL    string
	Title  string
}

type createIssueRequest struct {
	Title  string   `json:"title"`
	Body   string   `json:"body"`
	Labels []string `json:"labels"`
}

type createIssueResponse struct {
	Number  int    `json:"number"`
	HTMLURL string `json:"html_url"`
	Title   string `json:"title"`
	Message string `json:"message"`
}

func buildIssueBody(issue LinearIssue) string {
	body := ""
	if issue.Description != "" {
		body += issue.Description + "\n\n"
	}
	body += "---\n"
	body += fmt.Sprintf("*Imported from Linear: [%s](%s)*\n", issue.ID, issue.URL)
	body += fmt.Sprintf("*Linear state: %s*", issue.State)
	return body
}

func createGitHubIssue(ctx context.Context, token, owner, repo string, issue LinearIssue) (*GitHubIssue, error) {
	labels := make([]string, len(issue.Labels))
	copy(labels, issue.Labels)
	if label, ok := priorityLabels[issue.Priority]; ok {
		labels = append(labels, label)
	}

	data, err := json.Marshal(createIssueRequest{
		Title:  fmt.Sprintf("[%s] %s", issue.ID, issue.Title),
		Body:   buildIssueBody(issue),
		Labels: labels,
	})
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/issues", owner, repo)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var ghResp createIssueResponse
	if err := json.NewDecoder(resp.Body).Decode(&ghResp); err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("github API error %d: %s", resp.StatusCode, ghResp.Message)
	}

	return &GitHubIssue{
		Number: ghResp.Number,
		URL:    ghResp.HTMLURL,
		Title:  ghResp.Title,
	}, nil
}
