import axios from "axios";

// Replace with your GitHub Personal Access Token
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API_URL = "https://api.github.com";

async function getLinkedIssue(prUrl) {
    try {
        // Extract owner, repo, and pull number from the PR URL
        const urlParts = prUrl.split("/");
        const owner = urlParts[3];
        const repo = urlParts[4];
        const pullNumber = urlParts[6];

        // Fetch the pull request details
        const prResponse = await axios.get(
            `${GITHUB_API_URL}/repos/${owner}/${repo}/pulls/${pullNumber}`,
            {
                headers: {
                    Authorization: `token ${GITHUB_TOKEN}`,
                    Accept: "application/vnd.github.v3+json",
                },
            },
        );

        const prData = prResponse.data;

        // Check if the PR body contains a linked issue (e.g., "Fixes #123")
        const issueNumberMatch = prData.body.match(/fixes #(\d+)/i);
        if (issueNumberMatch) {
            const issueNumber = issueNumberMatch[1];
            console.log(
                `Linked Issue: https://github.com/${owner}/${repo}/issues/${issueNumber}`,
            );
        } else {
            console.log("No linked issue found in the PR body.");
        }
    } catch (error) {
        console.error(
            "Error fetching PR details:",
            error.response ? error.response.data : error.message,
        );
    }
}
