// diffParser.ts
import parseDiff, { File, Chunk, Change } from 'parse-diff';

interface Repository {
    owner: {
        login: string;
    };
    name: string;
}

interface PullRequest {
    number: number;
    head: {
        sha: string;
    };
}

interface GitHubPayload {
    pull_request: PullRequest;
    repository: Repository;
}

interface IssueCommentParams {
    owner: string;
    repo: string;
    issue_number: number;
    body: string;
}

interface ReviewCommentParams {
    owner: string;
    repo: string;
    pull_number: number;
    commit_id: string;
    path: string;
    body: string;
    line: number;
    mediaType?: {
        previews: string[];
    };
}

interface GitHubContext {
    octokit: {
        issues: {
            createComment: (params: IssueCommentParams) => Promise<unknown>;
        };
        pulls: {
            createReviewComment: (params: ReviewCommentParams) => Promise<unknown>;
            listFiles: (params: { owner: string; repo: string; pull_number: number }) => Promise<{ data: any[] }>;
            listReviewComments: (params: { owner: string; repo: string; pull_number: number }) => Promise<{ data: any[] }>;
        };
    };
    repo: () => { owner: string; repo: string };
    payload: GitHubPayload;
}

interface ProbotyApp {
    log: {
        info: (message: string) => void;
        error: (message: string) => void;
    };
}

async function parseGitDiffFromLLMOutput(llmOutput: string): Promise<string> {
    // Use regex to find the diff block with exact matching
    const diffRegex = /```diff([\s\S]*?)```/;
    const match = diffRegex.exec(llmOutput);
    
    if (match && match[1]) {
        // Return the content including the diff markers
        return '```diff' + match[1] + '```';
    }
    
    // Fallback to the original method if regex doesn't match
    const diffStart = llmOutput.indexOf('```diff');
    if (diffStart !== -1) {
        const diffEnd = llmOutput.indexOf('```', diffStart + 7);
        if (diffEnd !== -1) {
            return llmOutput.substring(diffStart, diffEnd + 3);
        }
    }
    
    // Return empty string if no diff is found
    return '';
}


export async function reviewPR(context: GitHubContext, app: ProbotyApp, llmOutput: string): Promise<void> {
    // Use regex for exact LGTM matching to avoid false positives
    const lgtmRegex = /\bLGTM\b/;
    const ifLGTM = lgtmRegex.test(llmOutput);
    
    if (ifLGTM) {
        await context.octokit.issues.createComment({
            ...context.repo(),
            issue_number: context.payload.pull_request.number,
            body: 'LGTM: LLM analysis is successful'
        });
        return;
    } 
    
    const gitDiff = await parseGitDiffFromLLMOutput(llmOutput);
    
    // Only proceed if we have a valid diff
    if (!gitDiff) {
        app.log.error('No valid diff found in LLM output');
        await context.octokit.issues.createComment({
            ...context.repo(),
            issue_number: context.payload.pull_request.number,
            body: 'Error: Could not parse diff from LLM output',
        });
        return;
    }

    // Create inline comments from the diff
    await createInlineCommentsFromDiff(gitDiff, context, app);

    // Post the LLM analysis as a comment
    await context.octokit.issues.createComment({
        ...context.repo(),
        issue_number: context.payload.pull_request.number,
        body: llmOutput,
    });
}


export async function createInlineCommentsFromDiff(diff: string, context: GitHubContext, app: ProbotyApp): Promise<void> {
    const parsedFiles: File[] = parseDiff(diff);
    const { pull_request, repository } = context.payload;

    for (const file of parsedFiles) {
        if (file.to === '/dev/null') {
            // Handle potential undefined value
            const filePath = file.from || '';
            app.log.info(`Skipping deleted file: ${filePath}`);
            continue;
        }

        const filePath = file.to || file.from || '';

        for (const chunk of file.chunks) {
            for (const change of chunk.changes) {
                if (change.type !== 'add') continue; // Focus on additions for comments

                const line = change.ln; // Line number in the new file
                const content = change.content.slice(1).trim();
                const body = `Suggested change:\n\`\`\`suggestion\n${content}\n\`\`\``;

                try {
                    await context.octokit.pulls.createReviewComment({
                        owner: repository.owner.login,
                        repo: repository.name,
                        pull_number: pull_request.number,
                        commit_id: pull_request.head.sha,
                        path: filePath,
                        body,
                        line,
                        mediaType: {
                            previews: ['comfort-fade'], // Enable comfort-fade preview
                        },
                    });
                    app.log.info(`Created comment on ${filePath} line ${line}`);
                } catch (error) {
                    if (error instanceof Error) {
                        app.log.error(
                            `Failed to create comment for ${filePath} line ${line}: ${error.message}`
                        );
                    } else {
                        app.log.error(
                            `Failed to create comment for ${filePath} line ${line}: Unknown error`
                        );
                    }
                }
            }
        }
    }
}