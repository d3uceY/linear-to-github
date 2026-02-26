import { transferIssues, TransferOptions } from "../transfer";
import * as linearModule from "../linear";
import * as githubModule from "../github";

jest.mock("@octokit/rest");
jest.mock("../linear");
jest.mock("../github");

const mockFetchLinearIssues = linearModule.fetchLinearIssues as jest.MockedFunction<
  typeof linearModule.fetchLinearIssues
>;
const mockCreateGitHubIssue = githubModule.createGitHubIssue as jest.MockedFunction<
  typeof githubModule.createGitHubIssue
>;
const mockCreateOctokit = githubModule.createOctokit as jest.MockedFunction<
  typeof githubModule.createOctokit
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fakeOctokit = {} as any;

const linearIssues: linearModule.LinearIssue[] = [
  {
    id: "ENG-1",
    title: "First issue",
    description: "Description one",
    priority: 2,
    state: "Todo",
    labels: ["feature"],
    url: "https://linear.app/team/ENG-1",
  },
  {
    id: "ENG-2",
    title: "Second issue",
    description: null,
    priority: 0,
    state: "Done",
    labels: [],
    url: "https://linear.app/team/ENG-2",
  },
];

const options: TransferOptions = {
  linearApiKey: "lin_api_key",
  githubToken: "ghp_token",
  githubOwner: "owner",
  githubRepo: "repo",
  delayMs: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateOctokit.mockReturnValue(fakeOctokit);
  mockFetchLinearIssues.mockResolvedValue(linearIssues);
  mockCreateGitHubIssue.mockImplementation(async (_, __, ___, issue) => ({
    number: 1,
    url: `https://github.com/owner/repo/issues/1`,
    title: `[${issue.id}] ${issue.title}`,
  }));
});

describe("transferIssues", () => {
  it("fetches linear issues with the correct API key and team ID", async () => {
    await transferIssues({ ...options, linearTeamId: "team-123" });
    expect(mockFetchLinearIssues).toHaveBeenCalledWith("lin_api_key", "team-123");
  });

  it("creates an Octokit instance with the github token", async () => {
    await transferIssues(options);
    expect(mockCreateOctokit).toHaveBeenCalledWith("ghp_token");
  });

  it("transfers all fetched issues", async () => {
    const summary = await transferIssues(options);
    expect(summary.total).toBe(2);
    expect(summary.transferred).toBe(2);
    expect(summary.failed).toBe(0);
    expect(summary.results).toHaveLength(2);
  });

  it("calls onProgress for each issue", async () => {
    const onProgress = jest.fn();
    await transferIssues(options, onProgress);
    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenNthCalledWith(1, 1, 2, linearIssues[0]);
    expect(onProgress).toHaveBeenNthCalledWith(2, 2, 2, linearIssues[1]);
  });

  it("records errors for failed issue transfers", async () => {
    mockCreateGitHubIssue.mockRejectedValueOnce(new Error("Rate limit exceeded"));

    const summary = await transferIssues(options);

    expect(summary.transferred).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.errors[0].issue).toBe(linearIssues[0]);
    expect(summary.errors[0].error).toBe("Rate limit exceeded");
  });

  it("continues transferring after a failed issue", async () => {
    mockCreateGitHubIssue.mockRejectedValueOnce(new Error("Network error"));

    const summary = await transferIssues(options);

    expect(summary.transferred).toBe(1);
    expect(summary.results[0].linearIssue).toBe(linearIssues[1]);
  });
});
