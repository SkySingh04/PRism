export async function handleSecurityWorkflowTrigger(context: any) {
  const { owner, repo } = context.repo();
  const { base } = context.payload.pull_request;

  try {
      await context.octokit.issues.createComment({
          ...context.repo(),
          issue_number: context.payload.pull_request.number,
          body: 'Running security check'
      });

      await context.octokit.actions.createWorkflowDispatch({
          owner,
          repo,
          workflow_id: 'security.yaml',
          ref: base.ref
      });
  } catch (error: any) {
      let errorMessage = 'Failed to run security check';
      if (error.status === 404) {
          errorMessage += ' (Workflow not found. Ensure security.yaml exists on the base branch.)';
      } else if (error.status === 403) {
          errorMessage += ' (Permission denied. Check GitHub App has Actions write access.)';
      }

      await context.octokit.issues.createComment({
          ...context.repo(),
          issue_number: context.payload.pull_request.number,
          body: errorMessage
      });
      console.error('Workflow dispatch error:', error);
  }
}