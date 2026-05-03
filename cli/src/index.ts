#!/usr/bin/env node

import "dotenv/config";
import { Command } from "commander";
import { transferIssues } from "./transfer";
import { LinearIssue } from "./linear";

const program = new Command();

program
  .name("linear-to-github")
  .description("Transfer Linear issues to GitHub")
  .version("1.0.0");

program
  .command("transfer")
  .description("Transfer all Linear issues to a GitHub repository")
  .requiredOption(
    "--linear-api-key <key>",
    "Linear API key",
    process.env.LINEAR_API_KEY
  )
  .requiredOption(
    "--github-token <token>",
    "GitHub personal access token",
    process.env.GITHUB_TOKEN
  )
  .requiredOption(
    "--github-owner <owner>",
    "GitHub repository owner (user or organization)",
    process.env.GITHUB_OWNER
  )
  .requiredOption(
    "--github-repo <repo>",
    "GitHub repository name",
    process.env.GITHUB_REPO
  )
  .option(
    "--linear-team-id <id>",
    "Linear team ID to filter issues (optional)",
    process.env.LINEAR_TEAM_ID
  )
  .option(
    "--delay <ms>",
    "Delay in milliseconds between GitHub API requests (default: 1000)",
    "1000"
  )
  .action(async (opts) => {
    const {
      linearApiKey,
      githubToken,
      githubOwner,
      githubRepo,
      linearTeamId,
      delay,
    } = opts;

    console.log("Starting transfer of Linear issues to GitHub...");
    console.log(`  GitHub repository: ${githubOwner}/${githubRepo}`);
    if (linearTeamId) {
      console.log(`  Linear team ID: ${linearTeamId}`);
    }
    console.log("");

    function onProgress(
      current: number,
      total: number,
      issue: LinearIssue
    ): void {
      console.log(`[${current}/${total}] Transferring: ${issue.id} - ${issue.title}`);
    }

    try {
      const summary = await transferIssues(
        {
          linearApiKey,
          githubToken,
          githubOwner,
          githubRepo,
          linearTeamId,
          delayMs: parseInt(delay, 10),
        },
        onProgress
      );

      console.log("");
      console.log("Transfer complete!");
      console.log(`  Total issues: ${summary.total}`);
      console.log(`  Successfully transferred: ${summary.transferred}`);
      console.log(`  Failed: ${summary.failed}`);

      if (summary.errors.length > 0) {
        console.log("");
        console.log("Failed issues:");
        for (const { issue, error } of summary.errors) {
          console.error(`  ${issue.id} - ${issue.title}: ${error}`);
        }
        process.exit(1);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

program.parse();
