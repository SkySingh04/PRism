import axios from 'axios';
import { getRulesForLLM } from './rules.js';
import { loadConfig } from './src/config/userConfig.js';
import { useCaseModels } from './src/config/models.js';

export async function handlePrAnalysis(
  context: { 
    octokit: { issues: { createComment: (arg0: any) => any; }; }; 
    repo: () => any; 
    payload: { pull_request: { number: any; }; }; 
  }, 
  prData: any, API : string, model: string
) {
  // Load current configuration
  const config = loadConfig();
  const useCase = config ? useCaseModels[config.useCase] : null;

  // Build the config info comment
  const configInfo = `## PRism Configuration
Use Case: ${config?.useCase || 'Not configured'}
API Endpoint: ${config?.apiEndpoint || 'Not configured'}

### Suggested Models for ${useCase?.name || 'current use case'}:
${useCase?.suggestedModels.map(model => `- ${model.name}: ${model.link}`).join('\n') || 'No models configured'}
`;

  // Post config info
  await context.octokit.issues.createComment({
    ...context.repo(),
    issue_number: context.payload.pull_request.number,
    body: configInfo,
  });

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
  const analysis = `PR Analysis using ${API}:
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

  // call the LLM analysis function with selected model
  await analyzeLLM(prData, rules.rules , API, model);
}


export async function analyzeLLM(prData: any, rules: any, API: string, model: string) {
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
  console.log(`Using Hugging Face API: ${API}`);
  console.log(`Using LLM model: ${model}`);
  console.log('Rules:', rules);
  console.log('PR Data:', prData);

  const prompt = `
  Here is some context about the PR made: ${prData}.

  Suggest the changes in the format of how git diff shows the changes.

  I must be able to parse the data and show it to the user.
  `

  // Call the API with the analysis context
  const response = await axios.post(API, {
    model: model,
    context: analysisContext
  });

  console.log('API Response:', response.data);

  await prData.octokit.issues.createComment({
    ...prData.repo(),
    issue_number: prData.payload.pull_request.number,
    body: `## LLM Analysis
    ${response.data}`
  });
}