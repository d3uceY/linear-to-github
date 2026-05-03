package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

// LinearIssue holds the fields we care about from a Linear issue.
type LinearIssue struct {
	ID          string
	Title       string
	Description string
	Priority    int
	State       string
	Labels      []string
	URL         string
}

type gqlRequest struct {
	Query     string                 `json:"query"`
	Variables map[string]any{} `json:"variables,omitempty"`
}

type gqlResponse struct {
	Data struct {
		Issues struct {
			Nodes []struct {
				Identifier  string  `json:"identifier"`
				Title       string  `json:"title"`
				Description *string `json:"description"`
				Priority    int     `json:"priority"`
				URL         string  `json:"url"`
				State       struct {
					Name string `json:"name"`
				} `json:"state"`
				Labels struct {
					Nodes []struct {
						Name string `json:"name"`
					} `json:"nodes"`
				} `json:"labels"`
			} `json:"nodes"`
		} `json:"issues"`
	} `json:"data"`
	Errors []struct {
		Message string `json:"message"`
	} `json:"errors"`
}

const issuesQuery = `
query Issues($filter: IssueFilter) {
  issues(first: 250, filter: $filter) {
    nodes {
      identifier
      title
      description
      priority
      url
      state {
        name
      }
      labels {
        nodes {
          name
        }
      }
    }
  }
}`

func fetchLinearIssues(apiKey, teamID string) ([]LinearIssue, error) {
	var variables map[string]any{}
	if teamID != "" {
		variables = map[string]any{}{
			"filter": map[string]any{}{
				"team": map[string]any{}{
					"id": map[string]any{}{
						"eq": teamID,
					},
				},
			},
		}
	}

	body, err := json.Marshal(gqlRequest{Query: issuesQuery, Variables: variables})
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(http.MethodPost, "https://api.linear.app/graphql", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", apiKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var gqlResp gqlResponse
	if err := json.NewDecoder(resp.Body).Decode(&gqlResp); err != nil {
		return nil, err
	}

	if len(gqlResp.Errors) > 0 {
		return nil, fmt.Errorf("linear API error: %s", gqlResp.Errors[0].Message)
	}

	issues := make([]LinearIssue, 0, len(gqlResp.Data.Issues.Nodes))
	for _, n := range gqlResp.Data.Issues.Nodes {
		desc := ""
		if n.Description != nil {
			desc = *n.Description
		}
		labels := make([]string, len(n.Labels.Nodes))
		for i, l := range n.Labels.Nodes {
			labels[i] = l.Name
		}
		issues = append(issues, LinearIssue{
			ID:          n.Identifier,
			Title:       n.Title,
			Description: desc,
			Priority:    n.Priority,
			State:       n.State.Name,
			Labels:      labels,
			URL:         n.URL,
		})
	}

	return issues, nil
}
