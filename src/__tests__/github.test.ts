import { LinearIssue } from "../linear";
import { createGitHubIssue, createOctokit } from "../github";
import { Octokit } from "@octokit/rest";

const mockIssueCreate = jest.fn();

jest.mock("@octokit/rest", () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    issues: {
      create: mockIssueCreate,
    },
  })),
}));

describe("createOctokit", () => {
  it("creates an Octokit instance with the provided token", () => {
    createOctokit("test-token");
    expect(Octokit).toHaveBeenCalledWith({ auth: "test-token" });
  });
});

describe("createGitHubIssue", () => {
  const octokit = new Octokit({ auth: "test" });

  const linearIssue: LinearIssue = {
    id: "ENG-42",
    title: "Fix login bug",
    description: "Users cannot log in with SSO.",
    priority: 1,
    state: "In Progress",
    labels: ["bug"],
    url: "https://linear.app/team/issue/ENG-42",
  };

  beforeEach(() => {
    mockIssueCreate.mockResolvedValue({
      data: {
        number: 7,
        html_url: "https://github.com/owner/repo/issues/7",
        title: "[ENG-42] Fix login bug",
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("creates a GitHub issue with correct title", async () => {
    await createGitHubIssue(octokit, "owner", "repo", linearIssue);

    expect(mockIssueCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "owner",
        repo: "repo",
        title: "[ENG-42] Fix login bug",
      })
    );
  });

  it("includes description and linear metadata in body", async () => {
    await createGitHubIssue(octokit, "owner", "repo", linearIssue);

    const call = mockIssueCreate.mock.calls[0][0];
    expect(call.body).toContain("Users cannot log in with SSO.");
    expect(call.body).toContain("ENG-42");
    expect(call.body).toContain("In Progress");
  });

  it("adds priority label for urgent issues", async () => {
    await createGitHubIssue(octokit, "owner", "repo", linearIssue);

    const call = mockIssueCreate.mock.calls[0][0];
    expect(call.labels).toContain("urgent");
    expect(call.labels).toContain("bug");
  });

  it("does not add priority label when priority is 0 (no priority)", async () => {
    const noPriorityIssue = { ...linearIssue, priority: 0 };
    await createGitHubIssue(octokit, "owner", "repo", noPriorityIssue);

    const call = mockIssueCreate.mock.calls[0][0];
    expect(call.labels).not.toContain("urgent");
    expect(call.labels).not.toContain("high");
    expect(call.labels).not.toContain("medium");
    expect(call.labels).not.toContain("low");
  });

  it("returns the created GitHub issue details", async () => {
    const result = await createGitHubIssue(octokit, "owner", "repo", linearIssue);

    expect(result).toEqual({
      number: 7,
      url: "https://github.com/owner/repo/issues/7",
      title: "[ENG-42] Fix login bug",
    });
  });

  it("handles issue with no description", async () => {
    const noDescIssue = { ...linearIssue, description: null };
    await createGitHubIssue(octokit, "owner", "repo", noDescIssue);

    const call = mockIssueCreate.mock.calls[0][0];
    expect(call.body).toContain("ENG-42");
    expect(call.body).not.toContain("null");
  });
});
