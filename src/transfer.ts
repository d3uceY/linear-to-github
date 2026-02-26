import { fetchLinearIssues, LinearIssue } from "./linear";
import { createOctokit, createGitHubIssue, GitHubIssue } from "./github";

export interface TransferOptions {
  linearApiKey: string;
  githubToken: string;
  githubOwner: string;
  githubRepo: string;
  linearTeamId?: string;
  delayMs?: number;
}

export interface TransferResult {
  linearIssue: LinearIssue;
  githubIssue: GitHubIssue;
}

export interface TransferSummary {
  total: number;
  transferred: number;
  failed: number;
  results: TransferResult[];
  errors: Array<{ issue: LinearIssue; error: string }>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function transferIssues(
  options: TransferOptions,
  onProgress?: (
    current: number,
    total: number,
    issue: LinearIssue
  ) => void
): Promise<TransferSummary> {
  const {
    linearApiKey,
    githubToken,
    githubOwner,
    githubRepo,
    linearTeamId,
    delayMs = 1000,
  } = options;

  const linearIssues = await fetchLinearIssues(linearApiKey, linearTeamId);
  const octokit = createOctokit(githubToken);

  const summary: TransferSummary = {
    total: linearIssues.length,
    transferred: 0,
    failed: 0,
    results: [],
    errors: [],
  };

  for (let i = 0; i < linearIssues.length; i++) {
    const issue = linearIssues[i];

    if (onProgress) {
      onProgress(i + 1, linearIssues.length, issue);
    }

    try {
      const githubIssue = await createGitHubIssue(
        octokit,
        githubOwner,
        githubRepo,
        issue
      );
      summary.results.push({ linearIssue: issue, githubIssue });
      summary.transferred++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      summary.errors.push({ issue, error: message });
      summary.failed++;
    }

    if (i < linearIssues.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  return summary;
}
