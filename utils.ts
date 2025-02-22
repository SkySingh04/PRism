export function formatComment(comment : any) {
    return {
      id: comment.id,
      user: comment.user?.login,
      body: comment.body,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      url: comment.html_url
    };
  }

  // Error handler
export async function handleError(context: { octokit: { issues: { createComment: (arg0: any) => any; }; }; repo: () => any; payload: { pull_request: { number: any; }; }; }, app: { log: any; on?: (arg0: string[], arg1: (context: any) => Promise<void>) => void; }, error: any) {
    app.log.error('PR processing error:');
    app.log.error(error.message);
    
    await context.octokit.issues.createComment({
      ...context.repo(),
      issue_number: context.payload.pull_request.number,
      body: '❌ Error processing PR: ' + error.message
    });
  }
