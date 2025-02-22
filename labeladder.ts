export interface LabelContext {
  octokit: any;
  repo: () => any;
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
    await context.octokit.issues.addLabels({
      ...context.repo(),
      issue_number: context.payload.pull_request.number,
      labels: [label]
    });
    return true;
  } catch (error) {
    console.error('Failed to add label:', error);
    return false;
  }
}
