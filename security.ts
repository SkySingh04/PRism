export async function handleSecurityWorkflowTrigger(context: any) {
    const { owner, repo } = context.repo();
    // const { base } = context.payload.pull_request;
  
    try {
      await context.octokit.issues.createComment({
        ...context.repo(),
        issue_number: context.payload.pull_request.number,
        body: 'Running security check'
      });
      
      await context.octokit.actions.createWorkflowDispatch({
        owner, repo, workflow_id: 'security.yaml', ref : "main"
      });
    } catch (error : any) {
      if (error.status === 404) {
        await context.octokit.issues.createComment({
          ...context.repo(),
          issue_number: context.payload.pull_request.number,
          body: 'Failed to run security check'
        });
        return;
      }
      throw error;
    }
  }
  