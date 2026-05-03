import { Octokit } from "@octokit/rest";
import { LinearIssue } from "./linear";

export interface GitHubIssue {
  number: number;
  url: string;
  title: string;
}

const PRIORITY_LABELS: Record<number, string> = {
  1: "urgent",
  2: "high",
  3: "medium",
  4: "low",
};

function buildIssueBody(issue: LinearIssue): string {
  const lines: string[] = [];

  if (issue.description) {
    lines.push(issue.description);
    lines.push("");
  }

  lines.push("---");
  lines.push(`*Imported from Linear: [${issue.id}](${issue.url})*`);
  lines.push(`*Linear state: ${issue.state}*`);

  return lines.join("\n");
}

export async function createGitHubIssue(
  octokit: Octokit,
  owner: string,
  repo: string,
  issue: LinearIssue
): Promise<GitHubIssue> {
  const labels: string[] = [...issue.labels];

  const priorityLabel = PRIORITY_LABELS[issue.priority];
  if (priorityLabel) {
    labels.push(priorityLabel);
  }

  const response = await octokit.issues.create({
    owner,
    repo,
    title: `[${issue.id}] ${issue.title}`,
    body: buildIssueBody(issue),
    labels,
  });

  return {
    number: response.data.number,
    url: response.data.html_url,
    title: response.data.title,
  };
}

export function createOctokit(token: string): Octokit {
  return new Octokit({ auth: token });
}
