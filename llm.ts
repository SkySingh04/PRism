import { getRulesForLLM } from './rules.js';
import { loadConfig } from './src/config/userConfig.js';
import { useCaseModels } from './src/config/models.js';

export async function handlePrAnalysis(
  context: { 
    octokit: { issues: { createComment: (arg0: any) => any; }; }; 
    repo: () => any; 
    payload: { pull_request: { number: any; }; }; 
  }, 
  prData: any, API : string
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

  // Build the analysis comment
  const analysis = `PR Analysis using ${API}:
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
  await analyzeLLM(prData, rules.rules , API);
}


export async function analyzeLLM(prData: any, rules: any, API: string) {
  console.log(`Using Hugging Face API: ${API}`);
  // Analyze the PR data against the rules
  // For now, we are just logging the rules and the PR data
  console.log('Rules:', rules);
  console.log('PR Data:', prData);
}