# linear-to-github

A CLI tool that transfers all your Linear issues to a GitHub repository.

## Features

- Fetches all issues from a Linear workspace (optionally filtered by team)
- Creates corresponding GitHub issues with:
  - Linear issue ID prefix in the title (e.g., `[ENG-42] Fix login bug`)
  - Original description and a link back to the Linear issue
  - Labels from Linear preserved on the GitHub issue
  - Priority mapped to a label (`urgent`, `high`, `medium`, `low`)
- Includes a configurable delay between GitHub API requests to avoid rate limiting
- Progress reporting and error summary

## Prerequisites

- Node.js 18+
- A [Linear API key](https://linear.app/settings/api)
- A [GitHub Personal Access Token](https://github.com/settings/tokens) with the `repo` scope

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and fill in your API keys and repository details
```

## Usage

### Run via npm scripts

```bash
npm run dev -- transfer
```

### Or build and run the compiled output

```bash
npm run build
node dist/index.js transfer
```

### Command-line options

All options can be provided via environment variables (see `.env.example`) or as CLI flags:

```
Usage: linear-to-github transfer [options]

Transfer all Linear issues to a GitHub repository

Options:
  --linear-api-key <key>    Linear API key (env: LINEAR_API_KEY)
  --github-token <token>    GitHub personal access token (env: GITHUB_TOKEN)
  --github-owner <owner>    GitHub repository owner (env: GITHUB_OWNER)
  --github-repo <repo>      GitHub repository name (env: GITHUB_REPO)
  --linear-team-id <id>     Linear team ID to filter issues (optional, env: LINEAR_TEAM_ID)
  --delay <ms>              Delay in milliseconds between GitHub API requests (default: 1000)
  -h, --help                display help for command
```

### Example

```bash
node dist/index.js transfer \
  --linear-api-key lin_api_xxxx \
  --github-token ghp_xxxx \
  --github-owner my-org \
  --github-repo my-repo \
  --linear-team-id team-id-here
```

## Environment Variables

| Variable          | Required | Description                                          |
|-------------------|----------|------------------------------------------------------|
| `LINEAR_API_KEY`  | Yes      | Linear personal API key                              |
| `GITHUB_TOKEN`    | Yes      | GitHub personal access token (needs `repo` scope)    |
| `GITHUB_OWNER`    | Yes      | GitHub repository owner (user or organization)       |
| `GITHUB_REPO`     | Yes      | GitHub repository name                               |
| `LINEAR_TEAM_ID`  | No       | Linear team ID to limit which issues are transferred |

## Development

```bash
# Run tests
npm test

# Type-check without emitting
npm run lint

# Build
npm run build
```
