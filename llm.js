export async function handlePrAnalysis(context, prData) {
    // CALL THE LLM HERE AND PASS THE
    // PR DATA TO IT

    //Just adding as a comment for now for debugging
    const analysis = `PR Analysis:
  Title: ${prData.metadata.title}
  Author: ${prData.metadata.author}
  Files Changed: ${prData.metadata.changed_files}
  Status: ${prData.metadata.state}
  Code Changes Summary: ${prData.code_changes}
  
  Summary: ${prData.metadata.body?.substring(0, 100)}...`;
  
    await context.octokit.issues.createComment({
      ...context.repo(),
      issue_number: context.payload.pull_request.number,
      body: analysis
    });
  }
