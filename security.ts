export async function handleSecurityWorkflowTrigger(context: { repo: () => { owner: any; repo: any; }; payload: { pull_request: { head: { ref: any; }; number: any; }; }; octokit: { repos: { getContent: (arg0: { owner: any; repo: any; path: string; ref: any; }) => any; }; actions: { createWorkflowDispatch: (arg0: { owner: any; repo: any; workflow_id: string; ref: any; }) => any; }; issues: { createComment: (arg0: any) => any; }; }; }) {
    const { owner, repo } = context.repo();
    const { ref } = context.payload.pull_request.head;
  
    try {
      await context.octokit.issues.createComment({
        ...context.repo(),
        issue_number: context.payload.pull_request.number,
        body: 'Running security check'
      });
      
      await context.octokit.actions.createWorkflowDispatch({
        owner, repo, workflow_id: 'security.yaml', ref
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
  