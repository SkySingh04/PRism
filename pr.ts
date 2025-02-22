// Core data collection functions
export async function getAllPrDetails(context: any, app: any) {
  const { pull_request: pr } = context.payload;
  const { owner, repo } = context.repo();
  const filesResult = await getPrFilesAndDiffs(context, app, owner, repo, pr.number);
  
  // Extract issue number from PR body or title using regex
  const issueNumber = extractIssueNumber(pr.body || pr.title);
  const issueData = issueNumber ? await getLinkedIssueData(context, app, owner, repo, issueNumber) : null;
  
  // Get repository context
  const repoContext = await getRepositoryContext(context, app);

  return {
      metadata: getPrMetadata(pr),
      comments: await getPrComments(context, app, owner, repo, pr.number),
      files: filesResult,
      relationships: {
          requested_reviewers: pr.requested_reviewers?.map((u: { login: any }) => u.login) || [],
          assignees: pr.assignees?.map((u: { login: any }) => u.login) || [],
          labels: pr.labels?.map((l: { name: any }) => l.name) || []
      },
      code_changes: extractCodeChangesForLLM(app, filesResult),
      linked_issue: issueData,
      repository: repoContext
  };
}

function extractIssueNumber(text: string): number | null {
  // Look for patterns like "fixes #123", "closes #123", "related to #123"
  const match = text?.match(/#(\d+)/);
  return match ? parseInt(match[1]) : null;
}

async function getLinkedIssueData(context: any, app: any, owner: string, repo: string, issueNumber: number) {
  try {
      const issue = await context.octokit.issues.get({
          owner,
          repo,
          issue_number: issueNumber
      });

      const comments = await context.octokit.paginate(
          context.octokit.issues.listComments,
          { owner, repo, issue_number: issueNumber }
      );

      return {
          number: issueNumber,
          title: issue.data.title,
          body: issue.data.body,
          state: issue.data.state,
          author: issue.data.user.login,
          created_at: issue.data.created_at,
          updated_at: issue.data.updated_at,
          labels: issue.data.labels.map((l: { name: any }) => l.name),
          assignees: issue.data.assignees.map((a: { login: any }) => a.login),
          comments: comments.map((c: any) => ({
              author: c.user.login,
              body: c.body,
              created_at: c.created_at
          }))
      };
  } catch (error) {
      app.log.error('Error fetching linked issue data:', error);
      return null;
  }
}

// Update extractCodeChangesForLLM to handle the files array directly
export function extractCodeChangesForLLM(app: any, files: any) {
  app.log.info("Processing code changes for files");
  app.log.info(files);

  // Check if files is an array; if not, log error and return empty
  if (!Array.isArray(files)) {
      app.log.error('Invalid files data:', files);
      return {
          summary: { files_changed: 0, total_additions: 0, total_deletions: 0 },
          changes: []
      };
  }

  // const codeFileExtensions = ['.js', '.py', '.java', '.cpp', '.ts', '.go', '.rs', '.php', '.rb'];
  
  const codeChanges = files
      // .filter((file: any) => {
      //     const ext = '.' + file.filename.split('.').pop().toLowerCase();
      //     return codeFileExtensions.includes(ext);
      // })
      .map((file: any) => {
          const changes = parsePatch(file.patch);
          return {
              file: file.filename,
              type: file.status,
              changes: {
                  removed: changes.removed.join('\n'),
                  added: changes.added.join('\n')
              },
              stats: {
                  additions: file.additions,
                  deletions: file.deletions
              }
          };
      });

  return {
      summary: {
          files_changed: codeChanges.length,
          total_additions: codeChanges.reduce((sum, file) => sum + file.stats.additions, 0),
          total_deletions: codeChanges.reduce((sum, file) => sum + file.stats.deletions, 0)
      },
      changes: codeChanges
  };
}

// Ensure getPrFilesAndDiffs returns an empty array on error
export async function getPrFilesAndDiffs(context: any, app: any, owner: string, repo: string, prNumber: number) {
  try {
      const files = await context.octokit.paginate(
          context.octokit.pulls.listFiles,
          { owner, repo, pull_number: prNumber }
      );
      return files.map((file: any) => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
          patch: file.patch || 'Diff too large to display'
      }));
  } catch (error) {
      app.log.error('Error fetching files:', error);
      return []; 
  }
}

  function getPrMetadata(pr : any) {
    return {
      title: pr.title,
      body: pr.body,
      author: pr.user.login,
      state: pr.state,
      draft: pr.draft,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      mergeable: pr.mergeable,
      additions: pr.additions,
      deletions: pr.deletions,
      changed_files: pr.changed_files,
      base: {
        branch: pr.base.ref,
        sha: pr.base.sha
      },
      head: {
        branch: pr.head.ref,
        sha: pr.head.sha
      }
    };
  }
  
  export async function getPrComments(context: { payload?: { pull_request: any; }; repo?: () => { owner: any; repo: any; }; octokit?: any; }, app: { log: any; on?: (arg0: string[], arg1: (context: any) => Promise<void>) => void; }, owner: any, repo: any, prNumber: any) {
    try {
      const [issueComments, reviewComments] = await Promise.all([
        context.octokit.paginate(context.octokit.issues.listComments, {
          owner, repo, issue_number: prNumber
        }),
        context.octokit.paginate(context.octokit.pulls.listReviewComments, {
          owner, repo, pull_number: prNumber
        })
      ]);
  
      return {
        issue_comments: issueComments.map(formatComment),
        review_comments: reviewComments.map(formatComment)
      };
    } catch (error) {
      app.log.error('Error fetching comments:', error);
      return { error: 'Failed to fetch comments' };
    }
  }

  function formatComment(comment : any) {
  return {
    id: comment.id,
    user: comment.user?.login,
    body: comment.body,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
    url: comment.html_url
  };
}


  
  function parsePatch(patch : any) {
    if (!patch || patch === 'Diff too large to display') {
      return { added: [], removed: [] };
    }
  
    const lines = patch.split('\n');
    const added: any[] = [];
    const removed: any[] = [];
  
    lines.forEach((line: any) => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        added.push(line.substring(1));
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        removed.push(line.substring(1));
      }
    });
  
    return { added, removed };
  }

async function getRepositoryContext(context: any, app: any) {
  const { owner, repo } = context.repo();
  try {
    // Fetch README content
    const readmeResponse = await context.octokit.repos.getReadme({
      owner,
      repo,
      mediaType: {
        format: 'raw',
      },
    });
    
    // Fetch repository structure using git trees
    const repoStructure = await context.octokit.git.getTree({
      owner,
      repo,
      tree_sha: 'HEAD',
      recursive: 'true'
    });

    const folderStructure = repoStructure.data.tree
      .filter((item: any) => !item.path.includes('node_modules/')) // Exclude node_modules
      .map((item: any) => item.path)
      .join('\n');

    return {
      readme: readmeResponse.data,
      structure: folderStructure,
      name: repo,
      owner: owner
    };
  } catch (error) {
    app.log.error('Error fetching repository context:', error);
    return {
      readme: 'Failed to fetch README',
      structure: 'Failed to fetch structure',
      name: repo,
      owner: owner
    };
  }
}