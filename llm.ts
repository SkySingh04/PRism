export async function handlePrAnalysis(context: { octokit: { issues: { createComment: (arg0: any) => any; }; }; repo: () => any; payload: { pull_request: { number: any; }; }; }, prData: { metadata: any; comments?: { issue_comments: any; review_comments: any; error?: undefined; } | { error: string; issue_comments?: undefined; review_comments?: undefined; }; files?: any; relationships?: { requested_reviewers: any; assignees: any; labels: any; }; code_changes: any; }) {
    // CALL THE LLM HERE AND PASS THE
    // PR DATA TO IT
    const code_changes = await JSON.stringify(prData.code_changes);

    //Just adding as a comment for now for debugging
    const analysis = `PR Analysis:
  Title: ${prData.metadata.title}
  Author: ${prData.metadata.author}
  Files Changed: ${prData.metadata.changed_files}
  Status: ${prData.metadata.state}
  Code Changes Summary: ${code_changes}
  
  Summary: ${prData.metadata.body?.substring(0, 100)}...`;
  
    await context.octokit.issues.createComment({
      ...context.repo(),
      issue_number: context.payload.pull_request.number,
      body: analysis
    });
  }
