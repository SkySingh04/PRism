import axios from 'axios';
import { getRulesForLLM } from './rules.js';
import { loadConfig } from './src/config/userConfig.js';
import { useCaseModels } from './src/config/models.js';
import { determineLabelFromAnalysis, addLabelToPR } from './src/addLabel.js';
import { App, GithubContext, PRData, IssueComment, Config } from './types.js';
// import { createInlineCommentsFromDiff } from './diffparser.js';

export async function handlePrAnalysis(
  context: GithubContext, 
  prData: PRData, 
  API: string, 
  model: string, 
  app: App
) {
  // Load current configuration
  const configResult = loadConfig();
  let useCase = null;
  let useCaseStr = 'Not configured';
  let apiEndpoint = 'Not configured';
  
  if (configResult.success) {
    const config = configResult.value;
    useCase = useCaseModels[config.useCase];
    useCaseStr = config.useCase;
    apiEndpoint = config.apiEndpoint;
  } else {
    app.log.error(`Failed to load configuration: ${configResult.error.message}`);
  }

  // Build the config info comment
  const configInfo = `## Keploy Configuration
Use Case: ${useCaseStr}
API Endpoint: ${apiEndpoint}

### Suggested Models for ${useCase?.name || 'current use case'}:
${useCase?.suggestedModels.map(model => `- ${model.name}: ${model.link}`).join('\n') || 'No models configured'}
`;
  // // Post config info
  // await context.octokit.issues.createComment({
  //   ...context.repo(),
  //   issue_number: context.payload.pull_request.number,
  //   body: configInfo,
  // });

  // Convert the code changes to a JSON string
  const code_changes = JSON.stringify(prData.code_changes, null, 2); // Adding indentation for better readability

  // Build the issue context if available
  const issueContext = prData.linked_issues && prData.linked_issues.issues_count > 0 ? `
  Linked Issues (${prData.linked_issues.issues_count}):
  ${prData.linked_issues.issues.map(issue => `
  Number: #${issue.number}
  Title: ${issue.title}
  Description: ${issue.body}
  State: ${issue.state}
  Labels: ${issue.labels.join(', ')}
  Assignees: ${issue.assignees.join(', ')}
  
  Issue Discussion:
  ${issue.comments.map((c: IssueComment) => 
    `${c.author} (${c.created_at}): ${c.body}`
  ).join('\n')}
  `).join('\n')}
  ` : 'No linked issues found';

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
  // await context.octokit.issues.createComment({
  //   ...context.repo(),
  //   issue_number: context.payload.pull_request.number,
  //   body: analysis,
  // });

  // Get the rules for LLM
  const rules = await getRulesForLLM(context);

  // If the rules are fetched successfully, post them as a comment
  // await context.octokit.issues.createComment({
  //   ...context.repo(),
  //   issue_number: context.payload.pull_request.number,
  //   body: rules.success ? rules.rules : rules.error,
  // });

  // call the LLM analysis function with selected model
  const llmOutput = await analyzeLLM(prData, rules.rules, API, model, app);

  // Determine and add appropriate label
  const labelToAdd = await determineLabelFromAnalysis(llmOutput);
  await addLabelToPR(context, context.payload.pull_request.number, labelToAdd);

  return llmOutput;
}

export async function analyzeLLM(prData: PRData, rules: string, API: string, model: string, app: App) {
  const analysisContext = {
    repository: {
      name: prData.repository.name,
      owner: prData.repository.owner,
      readme: prData.repository.readme,
      structure: prData.repository.structure
    },
    pr: prData,
    rules: rules,
    issue_context: prData.linked_issues && prData.linked_issues.issues_count > 0 ? 
      prData.linked_issues.issues.map(issue => ({
        issue_number: issue.number,
        issue_title: issue.title,
        issue_description: issue.body,
        issue_status: issue.state,
        issue_labels: issue.labels,
        issue_assignees: issue.assignees,
        issue_discussion: issue.comments
      })) : null
  };

  const stringanalysisContext = JSON.stringify(analysisContext, null, 2);
  
  const prompt = `
  
  Project Structure:
  ${prData.repository.structure}
  
  README Content:
  ${prData.repository.readme}
  
  PR Context:
  ${stringanalysisContext}

  Given the above repository context and PR changes, please analyze the changes and:
  1. Verify if the changes align with the project's structure and purpose as described in the README
  2. Check if the changes follow the project's conventions visible in the folder structure
  3. Suggest improvements or identify potential issues

  Suggest the changes in the format of git diff.
  
  You must follow the following pattern for suggestions:
  
  Suggested change:
  diff --git a/path/to/file b/path/to/file
  index abc1234..def5678 100644
  --- a/path/to/file
  +++ b/path/to/file
  @@ -line,count +line,count @@
  actual diff content

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
- Do NOT write anything else in the output, just the review comments or LGTM!.
- DO NOT TAKE CONTEXT FROM PREVIOUS CONTEXT. ONLY USE THE CONTEXT PROVIDED IN THE CURRENT PROMPT.
- LIMIT YOUR RESPONSE TO ONLY LGTM OR THE DIFF, DO NOT GO ON YAPPING AND LIMIT YOUR REVIEW COMMENTS TO ONLY 20 WORDS AND THE DIFF
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
  
  app.log.info('Analysis Context:', { context: stringanalysisContext });
  app.log.info(`Using Hugging Face API: ${API}`);
  app.log.info(`Using LLM model: ${model}`);
  app.log.info('Rules:', { rules });
  app.log.info('PR Data:', { prData: JSON.stringify(prData, null, 2) });


  // Call the API with the analysis context
  try {
    const response = await axios.post(API, {
      model: model,
      prompt: prompt,
      // max_tokens: 2000,
      temperature: 0.7,
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    app.log.info('LLM API response:', response.data);

    // Assuming the response data contains a 'generated_text' field with the analysis
    return response.data.generated_text || response.data;
  } catch (error) {
    app.log.error('Error calling LLM API:', error);
    return `Error analyzing PR: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}


