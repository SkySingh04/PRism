// Core data collection functions
export async function getAllPrDetails(context) {
    const { pull_request: pr } = context.payload;
    const { owner, repo } = context.repo();
  
    return {
      metadata: getPrMetadata(pr),
      comments: await getPrComments(context, owner, repo, pr.number),
      files: await getPrFilesAndDiffs(context, owner, repo, pr.number),
      relationships: {
        requested_reviewers: pr.requested_reviewers?.map(u => u.login) || [],
        assignees: pr.assignees?.map(u => u.login) || [],
        labels: pr.labels?.map(l => l.name) || []
      },
      code_changes: extractCodeChangesForLLM(prData)
    };
  }


  function getPrMetadata(pr) {
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
  
  export async function getPrComments(context, owner, repo, prNumber) {
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
      context.app.log.error('Error fetching comments:', error);
      return { error: 'Failed to fetch comments' };
    }
  }

  function formatComment(comment) {
  return {
    id: comment.id,
    user: comment.user?.login,
    body: comment.body,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
    url: comment.html_url
  };
}

export async function getPrFilesAndDiffs(context, owner, repo, prNumber) {
    try {
      const files = await context.octokit.paginate(
        context.octokit.pulls.listFiles,
        { owner, repo, pull_number: prNumber }
      );
  
      return files.map(file => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch || 'Diff too large to display'
      }));
    } catch (error) {
      context.app.log.error('Error fetching files:', error);
      return { error: 'Failed to fetch files' };
    }
  }

  export function extractCodeChangesForLLM(prData) {
    app.log.info( "Full PR data collected");
    app.log.info(prData);
    const { files } = prData;
    
    
    // Skip non-code files
    const codeFileExtensions = ['.js', '.py', '.java', '.cpp', '.ts', '.go', '.rs', '.php', '.rb'];
    
    const codeChanges = files
      .filter(file => {
        const ext = '.' + file.filename.split('.').pop().toLowerCase();
        return codeFileExtensions.includes(ext);
      })
      .map(file => {
        // Parse the patch to separate additions and deletions
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
  
  function parsePatch(patch) {
    if (!patch || patch === 'Diff too large to display') {
      return { added: [], removed: [] };
    }
  
    const lines = patch.split('\n');
    const added = [];
    const removed = [];
  
    lines.forEach(line => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        added.push(line.substring(1));
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        removed.push(line.substring(1));
      }
    });
  
    return { added, removed };
  }