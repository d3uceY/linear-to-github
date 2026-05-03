const Octokit = jest.fn().mockImplementation(() => ({
  issues: {
    create: jest.fn(),
  },
}));

module.exports = { Octokit };
