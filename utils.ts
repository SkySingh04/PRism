import { App, GithubContext, Comment } from './types.js';

export function formatComment(comment: Comment): string {
  return `
Comment by ${comment.user} (${comment.created_at}):
${comment.body}
---
`;
}

// Error handler
export async function handleError(
  context: GithubContext, 
  app: App, 
  error: Error | unknown
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  
  app.log.error('Error processing PR:', error);
  
  try {
    const commentParams = {
      ...context.repo(),
      issue_number: context.payload.pull_request.number,
      body: `## Error Processing PR
An error occurred while analyzing this PR:
\`\`\`
${errorMessage}
\`\`\`
Please check the application logs for more details.`
    };
    
    await context.octokit.issues.createComment(commentParams);
  } catch (commentError) {
    app.log.error('Failed to post error comment:', commentError);
  }
}
