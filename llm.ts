import axios from 'axios';
import { getRulesForLLM } from './rules.js';
import { loadConfig } from './src/config/userConfig.js';
import { useCaseModels } from './src/config/models.js';
// import { createInlineCommentsFromDiff } from './diffparser.js';


export async function handlePrAnalysis(
  context: { 
    octokit: { issues: { createComment: (arg0: any) => any; }; }; 
    repo: () => any; 
    payload: { pull_request: { number: any; }; }; 
  }, 
  prData: any, API : string, model: string , app: any
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
  const llmOutput = await analyzeLLM(prData, rules.rules , API  , model, app);

  // await prData.octokit.issues.createComment({
  //   ...prData.repo(),
  //   issue_number: prData.payload.pull_request.number,
  //   body: `## LLM Analysis
  //   ${llmOutput}`
  // });
  return llmOutput;
}

;
export async function analyzeLLM(prData: any, rules: any, API: string, model: string , app : any) {
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

  const stringanalysisContext = JSON.stringify(analysisContext, null, 2);
  app.log.info('Analysis Context:', stringanalysisContext);
  app.log.info(`Using Hugging Face API: ${API}`);
  app.log.info(`Using LLM model: ${model}`);
  app.log.info('Rules:', rules);
  app.log.info('PR Data:', prData);

  const prompt = `
  Here is some context about the PR made: ${stringanalysisContext}.

  
  Please check the codebase diff for the following rules:
  ${rules}

  ## GitHub PR Title

\`$title\` 

## Description

\`\`\`
$description
\`\`\`

## Summary of changes

\`\`\`
$short_summary
\`\`\`

## IMPORTANT Instructions

Input: New hunks annotated with line numbers and old hunks (replaced code). Hunks represent incomplete code fragments.
Additional Context: PR title, description, summaries and comment chains.
Task: Review new hunks for substantive issues using provided context and respond with comments if necessary.
Output: Review comments in markdown with exact line number ranges in new hunks. Start and end line numbers must be within the same hunk. For single-line comments, start=end line number. Must use example response format below.
Use fenced code blocks using the relevant language identifier where applicable.
Don't annotate code snippets with line numbers. Format and indent code correctly.
Do not use \`suggestion\` code blocks.
For fixes, use \`diff\` code blocks, marking changes with \`+\` or \`-\`. The line number range for comments with fix snippets must exactly match the range to replace in the new hunk.

- Do NOT provide general feedback, summaries, explanations of changes, or praises 
  for making good additions. 
- Focus solely on offering specific, objective insights based on the 
  given context and refrain from making broad comments about potential impacts on 
  the system or question intentions behind the changes.
- Do NOT write anything else in the output, just the review comments or LGTM.
- IF THERE ARE NO CHANGES, YOU MUST WRITE LGTM IN THE RESPONSE !!!

If there are no issues found on a line range, you MUST respond with the 
text \`LGTM!\` for that line range in the review section. 

## Example

### Example changes

---new_hunk---
\`\`\`
  z = x / y
    return z

20: def add(x, y):
21:     z = x + y
22:     retrn z
23: 
24: def multiply(x, y):
25:     return x * y

def subtract(x, y):
  z = x - y
\`\`\`
  
---old_hunk---
\`\`\`
  z = x / y
    return z

def add(x, y):
    return x + y

def subtract(x, y):
    z = x - y
\`\`\`

---comment_chains---
\`\`\`
Please review this change.
\`\`\`

---end_change_section---

### Example response

22-22:
There's a syntax error in the add function.
\`\`\`diff
-    retrn z
+    return z
\`\`\`
---
24-25:
LGTM!
  `

  // Call the API with the analysis context
  var response = await axios.post(API, {
    model: model,
    prompt
  });

  // const stringResp = await JSON.stringify(response.data, null, 2);
  // app.log.info('API Response:',stringResp);
  return response.data.response;
  
}


