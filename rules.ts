export async function getRulesForLLM(context: any) {
    const { owner, repo } = context.repo();
    const { ref } = context.payload.pull_request.head;
  
    try {
      const response = await context.octokit.repos.getContent({
        owner,
        repo, 
        path: 'rules.md',
        ref
      });
  
      const content = Buffer.from(response.data.content, 'base64').toString();
      
      return {
        success: true,
        rules: content,
        metadata: {
          ref,
          repo: `${owner}/${repo}`,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.status === 404 ? 'Rules file not found' : 'Failed to fetch rules',
        metadata: {
          ref,
          repo: `${owner}/${repo}`,
          timestamp: new Date().toISOString()
        }
      };
    }
  }