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
      }
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

