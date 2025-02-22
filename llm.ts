export async function handlePrAnalysis(
    context: {
        octokit: { issues: { createComment: (arg0: any) => any } };
        repo: () => any;
        payload: { pull_request?: { number: any }; issue?: { number: any } };
    },
    data: {
        metadata: any;
        comments?: any;
        files?: any;
        relationships?: any;
        code_changes?: any; // PRs have this, but issues don’t
    },
) {
    // Check if it's a PR or an issue
    const isPR = Boolean(context.payload.pull_request);

    let analysis;
    if (isPR) {
        // PR Analysis
        const codeChanges = JSON.stringify(data.code_changes, null, 2);
        analysis = `PR Analysis:
    Title: ${data.metadata.title}
    Author: ${data.metadata.author}
    Files Changed: ${data.metadata.changed_files}
    Status: ${data.metadata.state}
    Code Changes Summary: ${codeChanges}
    
    Summary: ${data.metadata.body?.substring(0, 100)}...`;
    } else {
        // Issue Analysis
        analysis = `Issue Analysis:
    Title: ${data.metadata.title}
    Author: ${data.metadata.author}
    State: ${data.metadata.state}
    Labels: ${data.metadata.labels.join(", ")}
    
    Summary: ${data.metadata.body?.substring(0, 100)}...
    
    Comments (${data.comments.length}): ${data.comments
        .map((c: any) => `- ${c.user}: ${c.body.substring(0, 50)}...`)
        .join("\n")}`;
    }

    // Post the analysis as a comment
    await context.octokit.issues.createComment({
        ...context.repo(),
        issue_number: isPR
            ? context.payload.pull_request!.number
            : context.payload.issue!.number,
        body: analysis,
    });
}
