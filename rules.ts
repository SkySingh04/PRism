import { GithubContext, Rules } from './types.js';

export async function getRulesForLLM(context: GithubContext): Promise<Rules> {
  try {
    const { owner, repo } = context.repo();
    const response = await context.octokit.repos.getContent({
      owner,
      repo,
      path: 'rules.md',
      ref: context.payload.pull_request?.head?.ref
    });

    // Check if the response is valid and contains content
    if (response.data && 'content' in response.data && response.data.content) {
      const content = Buffer.from(response.data.content, 'base64').toString();
      return { success: true, rules: content };
    }

    return {
      success: false,
      rules: '',
      error: 'Failed to load rules.md - missing or invalid content'
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      rules: 'No specific rules found. Please follow general good practices.',
      error: `Error loading rules.md: ${errorMessage}`
    };
  }
}