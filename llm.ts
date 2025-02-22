import {getRulesForLLM} from './rules.js';

export async function handlePrAnalysis(
  context: { 
    octokit: { issues: { createComment: (arg0: any) => any; }; }; 
    repo: () => any; 
    payload: { pull_request: { number: any; }; }; 
  }, 
  prData: any
) {
  // Convert the code changes to a JSON string
  const code_changes = JSON.stringify(prData.code_changes, null, 2); // Adding indentation for better readability

  // Build the issue context if available
  const issueContext = prData.linked_issue ? `
  Linked Issue:
  Number: #${prData.linked_issue.number}
  Title: ${prData.linked_issue.title}
  Description: ${prData.linked_issue.body}
  State: ${prData.linked_issue.state}
  Labels: ${prData.linked_issue.labels.join(', ')}
  Assignees: ${prData.linked_issue.assignees.join(', ')}
  
  Issue Discussion:
  ${prData.linked_issue.comments.map((c: any) => 
    `${c.author} (${c.created_at}): ${c.body}`
  ).join('\n')}
  ` : 'No linked issue found';

  // Build the analysis comment
  const analysis = `PR Analysis:
  Title: ${prData.metadata.title}
  Author: ${prData.metadata.author}
  Files Changed: ${prData.metadata.changed_files}
  Status: ${prData.metadata.state}
  Code Changes Summary: ${code_changes}
  
  ${issueContext}
  
  Summary: ${prData.metadata.body?.substring(0, 100)}...`;

  
  // Post the comment to the PR
  await context.octokit.issues.createComment({
    ...context.repo(),
    issue_number: context.payload.pull_request.number,
    body: analysis,
  });

  // Get the rules for LLM
  const rules = await getRulesForLLM(context);

  // If the rules are fetched successfully, post them as a comment
  await context.octokit.issues.createComment({
    ...context.repo(),
    issue_number: context.payload.pull_request.number,
    body: rules.success ? rules.rules : rules.error,
  });

  // call the LLM analysis function
  await analyzeLLM(prData, rules.rules);
}


export async function analyzeLLM(prData: any, rules: any) {
  // Include issue context in LLM analysis
  const analysisContext = {
    pr: prData,
    rules: rules,
    issue_context: prData.linked_issue ? {
      issue_number: prData.linked_issue.number,
      issue_title: prData.linked_issue.title,
      issue_description: prData.linked_issue.body,
      issue_status: prData.linked_issue.state,
      issue_labels: prData.linked_issue.labels,
      issue_assignees: prData.linked_issue.assignees,
      issue_discussion: prData.linked_issue.comments
    } : null
  };

  console.log('Analysis Context:', analysisContext);
  // TODO: Implement actual LLM analysis with the enhanced context
}