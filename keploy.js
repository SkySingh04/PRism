
async function handleKeployWorkflowTrigger(context) {
    const { owner, repo } = context.repo();
    const { ref } = context.payload.pull_request.head;
  
    try {
      await context.octokit.repos.getContent({
        owner, repo, path: 'prism', ref
      });
      
      await context.octokit.actions.createWorkflowDispatch({
        owner, repo, workflow_id: 'prism.yaml', ref
      });
    } catch (error) {
      if (error.status === 404) {
        await context.octokit.issues.createComment({
          ...context.repo(),
          issue_number: context.payload.pull_request.number,
          body: '⚠️ Missing /prism folder'
        });
        return;
      }
      throw error;
    }
  }
  