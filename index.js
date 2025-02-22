// Deployments API example
// See: https://developer.github.com/v3/repos/deployments/ to learn more

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
export default (app) => {
  app.log.info("Yay, the app was loaded!");
  app.on(
    ["pull_request.opened", "pull_request.synchronize"],
    async (context) => {
      try {
        const { owner, repo } = context.repo();
        const { ref } = context.payload.pull_request.head;
    
        try {
          await context.octokit.repos.getContent({
            owner,
            repo,
            path: 'prism',
            ref: ref
          });
          app.log.info('/prism folder exists');
          app.log.info('Attempting workflow dispatch:', {
            owner,
            repo,
            workflow_id: 'prism.yaml',
            ref
          });
          // Trigger prism.yaml workflow
          await context.octokit.actions.createWorkflowDispatch({
            owner,
            repo,
            workflow_id: 'prism.yaml',
            ref: ref
          });
    
        } catch (error) {
          if (error.status === 404) {
            app.log.warn('/prism folder not found');
            await context.octokit.issues.createComment({
              ...context.repo(),
              issue_number: context.payload.pull_request.number,
              body: '⚠️ Cannot trigger prism workflow: The `/prism` folder is missing in this PR.'
            });
            return;
          }
          throw error;
        }
    
      } catch (error) {
        app.log.error('Error checking /prism folder:', error);
        await context.octokit.issues.createComment({
          ...context.repo(),
          issue_number: context.payload.pull_request.number,
          body: '❌ Error occurred while running prism tests.'
        });
      }
    }
  );
};