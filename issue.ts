import { handlePrAnalysis } from "./llm.js";
import { handleError } from "./utils.js";

export async function getIssueDetails(context: any, app: any) {
    try {
        const { owner, repo } = context.repo();
        const issueNumber = context.payload.issue.number;

        const issue = await context.octokit.issues.get({
            owner,
            repo,
            issue_number: issueNumber,
        });

        return {
            metadata: {
                title: issue.data.title,
                body: issue.data.body,
                author: issue.data.user.login,
                state: issue.data.state,
                created_at: issue.data.created_at,
                updated_at: issue.data.updated_at,
                labels: issue.data.labels.map((label: any) => label.name),
                changed_files: 0, // Issues don't have changed files
            },
            comments: {
                issue_comments: await getIssueComments(
                    context,
                    app,
                    owner,
                    repo,
                    issueNumber,
                ),
                review_comments: [] // Issues don't have review comments
            },
            files: [], // Issues don't have files
            relationships: {
                requested_reviewers: [],
                assignees: issue.data.assignees,
                labels: issue.data.labels
            },
            code_changes: {} // Issues don't have code changes
        };
    } catch (error) {
        app.log.error("Error fetching issue details:", error);
        return null;
    }
}

export async function getIssueComments(
    context: any,
    app: any,
    owner: string,
    repo: string,
    issueNumber: number,
) {
    try {
        const comments = await context.octokit.paginate(
            context.octokit.issues.listComments,
            {
                owner,
                repo,
                issue_number: issueNumber,
            },
        );

        return comments.map((comment: any) => ({
            id: comment.id,
            user: comment.user.login,
            body: comment.body,
            created_at: comment.created_at,
            updated_at: comment.updated_at,
        }));
    } catch (error) {
        app.log.error("Error fetching issue comments:", error);
        return [];
    }
}

export async function handleIssueEvent(context: any, app: any) {
    try {
        const issueData = await getIssueDetails(context, app);
        if (!issueData) return;

        await handlePrAnalysis(context, issueData);
    } catch (error) {
        await handleError(context, app, error);
    }
}
