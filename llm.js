async function handlePrAnalysis(context, prData) {
    // Ye karna h bhai
    const analysis = `PR Analysis:
  Title: ${prData.metadata.title}
  Author: ${prData.metadata.author}
  Files Changed: ${prData.metadata.changed_files}
  Status: ${prData.metadata.state}
  
  Summary: ${prData.metadata.body?.substring(0, 100)}...`;
  
    await context.octokit.issues.createComment({
      ...context.repo(),
      issue_number: context.payload.pull_request.number,
      body: analysis
    });
  }