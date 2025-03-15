import { GithubContext } from './types.js';

export async function handleLintWorkflowTrigger(context: GithubContext) {
  const { owner, repo } = context.repo();
  const ref = context.payload.pull_request.head.ref;

  try {    
    await context.octokit.actions.createWorkflowDispatch({
      owner, 
      repo, 
      workflow_id: 'lint.yaml', 
      ref
    });
  } catch (error: unknown) {
    const errorObj = error as { status?: number; message?: string };
    
    const errorMessage = errorObj.message || 'Unknown error';
    const statusCode = errorObj.status ? ` (Status: ${errorObj.status})` : '';
    
    let commentBody: string;
    
    if (errorObj.status === 404) {
      commentBody = 'Lint workflow failed: Workflow file not found or inaccessible';
    } else if (errorObj.status === 403) {
      commentBody = 'Lint workflow failed: Permission denied to access or trigger workflow';
    } else if (errorObj.status === 422) {
      commentBody = 'Lint workflow failed: Request validation failed, please check workflow configuration';
    } else {
      commentBody = `Lint workflow failed: ${errorMessage}${statusCode}`;
    }
    
    console.error('Lint workflow error:', error);
    
    await context.octokit.issues.createComment({
      ...context.repo(),
      issue_number: context.payload.pull_request.number,
      body: commentBody
    });
    
    if (errorObj.status !== 404 && errorObj.status !== 403 && errorObj.status !== 422) {
      throw error;
    }
  }
}
  