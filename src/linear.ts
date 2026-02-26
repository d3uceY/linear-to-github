import { LinearClient, Issue } from "@linear/sdk";

export interface LinearIssue {
  id: string;
  title: string;
  description: string | null | undefined;
  priority: number;
  state: string;
  labels: string[];
  url: string;
}

export async function fetchLinearIssues(
  apiKey: string,
  teamId?: string
): Promise<LinearIssue[]> {
  const client = new LinearClient({ apiKey });

  const issueFilter = teamId ? { team: { id: { eq: teamId } } } : undefined;

  const issues = await client.issues({
    filter: issueFilter,
    first: 250,
  });

  const results: LinearIssue[] = [];

  for (const issue of issues.nodes) {
    const state = await issue.state;
    const labelConnection = await issue.labels();

    results.push({
      id: issue.identifier,
      title: issue.title,
      description: issue.description,
      priority: issue.priority,
      state: state?.name ?? "Unknown",
      labels: labelConnection.nodes.map((l) => l.name),
      url: issue.url,
    });
  }

  return results;
}
