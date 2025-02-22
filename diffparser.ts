// diffParser.ts
import parseDiff from 'parse-diff';

export async function reviewPR(context: any, app: any, llmOutput: any) {
    //trim the llmOutput to only include the diff
    // const gitDiff = parseGitDiffFromLLMOutput(llmOutput);
    const gitDiff = `diff --git a/src/index.js b/src/index.js
index abc1234..def5678 100644
--- a/src/index.js
+++ b/src/index.js
@@ -1,5 +1,5 @@
 function add(a, b) {
-    return a - b; // Bug: Subtraction instead of addition
+    return a + b; // Fixed: Now correctly adds
 }

 function subtract(a, b) {
@@ -10,7 +10,7 @@ function subtract(a, b) {
 function multiply(a, b) {
     return a * b;
 }

-function divide(a, b) {
-    return a / b;
+function divide(a, b) {
+    return b !== 0 ? a / b : NaN; // Added check for division by zero
 }
diff --git a/tests/test.js b/tests/test.js
index 1234567..890abcd 100644
--- a/tests/test.js
+++ b/tests/test.js
@@ -5,6 +5,6 @@ describe('Math operations', () => {
         expect(add(2, 3)).toBe(5);
     });

-    test('subtract should return the difference', () => {
+    test('subtract should return the correct difference', () => {
         expect(subtract(5, 3)).toBe(2);
     });
 });
    `;
    // Create inline comments from the diff
    await createInlineCommentsFromDiff(gitDiff, context, app);

    // Post the LLM analysis as a comment
    // await context.octokit.issues.createComment({
    //     ...context.repo(),
    //     issue_number: context.payload.pull_request.number,
    //     body: llmOutput,
    // });
}

export async function createInlineCommentsFromDiff(diff: string, context: any , app : any) {
    const parsedFiles = parseDiff(diff);

    const { pull_request, repository } = context.payload;
    const pullNumber = pull_request.number;
    const commitId = pull_request.head.sha;
    const owner = repository.owner.login;
    const repo = repository.name;

    for (const file of parsedFiles) {
        for (const chunk of file.chunks) {
            for (const change of chunk.changes) {
                if (change.type !== 'add' && change.type !== 'del') {
                    continue;
                }

                // Determine line number and file path
                const side = change.type === 'add' ? 'RIGHT' : 'LEFT';
                const line = change.type === 'add' ? change.ln! : change.ln!;
                const filePath = change.type === 'add' ? file.to! : file.from!;

                // Skip deleted files
                if (filePath === '/dev/null') {
                    app.log.info(`Skipping comment for deleted file: ${file.from}`);
                    continue;
                }

                // Prepare comment content
                const content = change.content.slice(1).trim();
                const body =
                    change.type === 'add'
                        ? `Suggested change:\n\`\`\`suggestion\n${content}\n\`\`\``
                        : `Suggested deletion: ${content}`;

                try {
                    await context.octokit.pulls.createReviewComment({
                        owner,
                        repo,
                        pull_number: pullNumber,
                        commit_id: commitId,
                        path: filePath,
                        line,
                        side,
                        body,
                    });
                    app.log.info(`Created comment on ${filePath} line ${line}`);
                } catch (error : any) {
                    app.log.error(`Failed to create comment: ${error.message}`);
                }
            }
        }
    }
}

