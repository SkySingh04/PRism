export interface LabelContext {
  octokit: {
    issues: {
      addLabels: (params: any) => Promise<any>;
    };
    pulls: {
      get: (params: any) => Promise<any>;
      createReviewComment: (params: any) => Promise<any>;
    };
  };
  repo: () => { owner: string; repo: string };
  payload: {
    pull_request: {
      number: number;
    };
  };
}

export async function addPRLabel(context: LabelContext, labelDecision: string) {
  const labelMap: { [key: string]: string } = {
    'LGTM': 'LGTM',
    'NEEDS_CHANGES': 'needs changes',
    'SPAM': 'spam'
  };

  const label = labelMap[labelDecision] || 'needs changes';

  try {
    // First, get the pull request details to ensure we have valid commit references
    const { data: pullRequest } = await context.octokit.pulls.get({
      ...context.repo(),
      pull_number: context.payload.pull_request.number
    });

    // Add the label
    await context.octokit.issues.addLabels({
      ...context.repo(),
      issue_number: context.payload.pull_request.number,
      labels: [label]
    });

    // If you need to add a review comment, include required fields
    if (labelDecision === 'NEEDS_CHANGES') {
      await context.octokit.pulls.createReviewComment({
        ...context.repo(),
        pull_number: context.payload.pull_request.number,
        commit_id: pullRequest.head.sha,
        body: `Changes requested: PR has been labeled as "${label}"`,
        path: 'README.md',  // Specify a file path that exists in the PR
        line: 1
      });
    }

    return true;
  } catch (error) {
    console.error('Failed to add label or comment:', error);
    return false;
  }
}