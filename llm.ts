import {getRulesForLLM} from './rules.js';

export async function handlePrAnalysis(
  context: { 
    octokit: { issues: { createComment: (arg0: any) => any; }; }; 
    repo: () => any; 
    payload: { pull_request: { number: any; }; }; 
  }, 
  prData: { 
    metadata: any; 
    comments?: { issue_comments: any; review_comments: any; error?: undefined; } | { error: string; issue_comments?: undefined; review_comments?: undefined; }; 
    files?: any; 
    relationships?: { requested_reviewers: any; assignees: any; labels: any; }; 
    code_changes: any; 
  }
) {
  // Convert the code changes to a JSON string
  const code_changes = JSON.stringify(prData.code_changes, null, 2); // Adding indentation for better readability

  // Build the analysis comment
  const analysis = `PR Analysis using ${selectedModel}:
  Title: ${prData.metadata.title}
  Author: ${prData.metadata.author}
  Files Changed: ${prData.metadata.changed_files}
  Status: ${prData.metadata.state}
  Code Changes Summary: ${code_changes}
  
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

  // call the LLM analysis function with selected model
  await analyzeLLM(prData, rules.rules, selectedModel);
}


export async function analyzeLLM(prData: any, rules: any, model: string) {
  console.log(`Using Hugging Face model: ${model}`);
  // Analyze the PR data against the rules
  // For now, we are just logging the rules and the PR data
  console.log('Rules:', rules);
  console.log('PR Data:', prData);
}