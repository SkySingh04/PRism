// Core data collection functions
import { 
  App, 
  GithubContext, 
  PullRequest, 
  PRData, 
  Comment, 
  FileChange, 
  CodeChanges, 
  LinkedIssue,
  LinkedIssues,
  PatchResult
} from './types.js';

// Define a local ApiError class
class ApiError extends Error {
  public readonly status?: number;

  constructor(message: string, public readonly cause?: unknown, status?: number) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }

  public static fromError(error: unknown): ApiError {
    const errorObj = error as { status?: number; message?: string };
    const errorMessage = errorObj.message || 'Unknown API error';
    const statusCode = errorObj.status;
    
    return new ApiError(errorMessage, error, statusCode);
  }
}

// Define a Result type for handling success/failure
type Result<T, E = Error> = 
  | { success: true; value: T } 
  | { success: false; error: E };

export async function getAllPrDetails(context: GithubContext, app: App): Promise<PRData> {
  const { pull_request: pr } = context.payload;
  const { owner, repo } = context.repo();
  
  // Extract issue number from PR body or title using regex
  const issueNumbers = extractIssueNumbers(pr.body || pr.title);
  
  // Prepare all async operations to run in parallel
  const promises = {
    filesResult: getPrFilesAndDiffs(context, app, owner, repo, pr.number),
    prComments: getPrComments(context, app, owner, repo, pr.number),
    repoContext: getRepositoryContext(context, app)
  };
  
  // Add issue data promise conditionally
  let issuesDataPromise = null;
  if (issueNumbers.length > 0) {
    issuesDataPromise = getLinkedIssueData(context, app, owner, repo, issueNumbers);
  }
  
  // Execute all promises in parallel
  const [
    filesResult,
    prComments,
    repoContext
  ] = await Promise.all([
    promises.filesResult,
    promises.prComments,
    promises.repoContext
  ]);
  
  // Process issue data separately since it's conditional
  let issuesData: LinkedIssues | null = null;
  if (issuesDataPromise) {
    const issuesResult = await issuesDataPromise;
    if (issuesResult.success) {
      issuesData = issuesResult.value;
    } else {
      app.log.error(`Failed to get linked issue data: ${issuesResult.error.message}`);
      // Optionally post a comment about the issue data fetch failure
    }
  }

  return {
      metadata: getPrMetadata(pr),
      comments: prComments,
      files: filesResult,
      relationships: {
          requested_reviewers: pr.requested_reviewers?.map((u) => u.login) || [],
          assignees: pr.assignees?.map((u) => u.login) || [],
          labels: pr.labels?.map((l) => l.name) || []
      },
      code_changes: extractCodeChangesForLLM(app, filesResult),
      linked_issues: issuesData,
      repository: repoContext
  };
}

function extractIssueNumbers(text: string): number[] {
  if (!text) return [];
  
  // Look for patterns like "fixes #123", "closes #123", "related to #123"
  const regex = /#(\d+)/g;
  const matches = [...text.matchAll(regex)];
  return matches.map(match => parseInt(match[1]));
}

async function getLinkedIssueData(context: GithubContext, app: App, owner: string, repo: string, issueNumbers: number[]): Promise<Result<LinkedIssues, Error>> {
  try {
      const issuePromises = issueNumbers.map(async (issueNumber) => {
          const [issue, comments] = await Promise.all([
              context.octokit.issues.get({
                  owner,
                  repo,
                  issue_number: issueNumber
              }),
              context.octokit.paginate(
                  context.octokit.issues.listComments,
                  { owner, repo, issue_number: issueNumber }
              )
          ]);
          return {
              number: issueNumber,
              title: issue.data.title,
              body: issue.data.body,
              state: issue.data.state,
              author: issue.data.user.login,
              created_at: issue.data.created_at,
              updated_at: issue.data.updated_at,
              labels: issue.data.labels.map((l: { name: string }) => l.name),
              assignees: issue.data.assignees.map((a: { login: string }) => a.login),
              comments: comments.map((c) => {
                  const comment = c as { user: { login: string }, body: string, created_at: string };
                  return {
                      author: comment.user.login,
                      body: comment.body,
                      created_at: comment.created_at
                  };
              })
          };
      });

      const issues = await Promise.all(issuePromises);

      return {
        success: true,
        value: {
          issues: issues,
          issues_count: issues.length
        }
      };
  } catch (error) {
      const appError = ApiError.fromError(error);
      app.log.error(`Error fetching linked issue data: ${appError.message}`, error);
      return { success: false, error: appError };
  }
}

// Update extractCodeChangesForLLM to handle the files array directly
export function extractCodeChangesForLLM(app: App, files: FileChange[]): CodeChanges {
  app.log.info("Processing code changes for files");
  // Using string interpolation to safely convert object to string for logging
  app.log.info(`Files: ${files.length} items`);

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
      // .filter((file) => {
      //     const ext = '.' + file.filename.split('.').pop().toLowerCase();
      //     return codeFileExtensions.includes(ext);
      // })
      .map((file) => {
          const f = file as { 
            filename: string, 
            status: string, 
            additions: number, 
            deletions: number, 
            changes: number, 
            patch?: string 
          };
          const changes = parsePatch(f.patch);
          return {
              file: f.filename,
              type: f.status,
              changes: {
                  removed: changes.removed.join('\n'),
                  added: changes.added.join('\n')
              },
              stats: {
                  additions: f.additions,
                  deletions: f.deletions
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
export async function getPrFilesAndDiffs(context: GithubContext, app: App, owner: string, repo: string, prNumber: number): Promise<FileChange[]> {
  try {
      const files = await context.octokit.paginate(
          context.octokit.pulls.listFiles,
          { owner, repo, pull_number: prNumber }
      );
      return files.map((file) => {
          const f = file as { 
            filename: string, 
            status: string, 
            additions: number, 
            deletions: number, 
            changes: number, 
            patch?: string 
          };
          return {
              filename: f.filename,
              status: f.status,
              additions: f.additions,
              deletions: f.deletions,
              changes: f.changes,
              patch: f.patch || 'Diff too large to display'
          };
      });
  } catch (error: unknown) {
      const errorObj = error as { status?: number; message?: string };
      const errorMessage = errorObj.message || 'Unknown error';
      const statusCode = errorObj.status ? ` (Status: ${errorObj.status})` : '';
      
      app.log.error(`Error fetching files: ${errorMessage}${statusCode}`, error);
      
      try {
          if (prNumber) {
              await context.octokit.issues.createComment({
                  owner,
                  repo,
                  issue_number: prNumber,
                  body: `⚠️ Failed to fetch PR files: ${errorMessage}${statusCode}`
              });
          }
      } catch (commentError) {
          app.log.error('Failed to post error comment:', commentError);
      }
      
      return []; 
  }
}

function getPrMetadata(pr: PullRequest) {
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

export async function getPrComments(
  context: {
    payload?: { pull_request: PullRequest };
    repo?: () => { owner: string; repo: string };
    octokit?: {
      issues: { 
        listComments: Function;
        createComment: Function;
      };
      pulls: { listReviewComments: Function };
      paginate: Function;
    }
  }, 
  app: App, 
  owner: string, 
  repo: string, 
  prNumber: number
) {
  try {
    if (!context.octokit) {
      app.log.error('Octokit is undefined');
      return { issue_comments: [], review_comments: [] };
    }

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
  } catch (error: unknown) {
    const errorObj = error as { status?: number; message?: string };
    const errorMessage = errorObj.message || 'Unknown error';
    const statusCode = errorObj.status ? ` (Status: ${errorObj.status})` : '';
    
    app.log.error(`Error fetching comments: ${errorMessage}${statusCode}`, error);
    
    try {
      if (context.octokit && prNumber) {
        await context.octokit.issues.createComment({
          owner,
          repo,
          issue_number: prNumber,
          body: `⚠️ Failed to fetch PR comments: ${errorMessage}${statusCode}`
        });
      }
    } catch (commentError) {
      app.log.error('Failed to post error comment:', commentError);
    }
    
    return { issue_comments: [], review_comments: [] };
  }
}

function formatComment(comment: {
  id: number;
  user?: { login: string };
  body: string;
  created_at: string;
  updated_at: string;
  html_url: string;
}): Comment {
  return {
    id: comment.id,
    user: comment.user?.login || 'unknown',
    body: comment.body,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
    url: comment.html_url
  };
}

function parsePatch(patch: string | undefined): PatchResult {
  if (!patch || patch === 'Diff too large to display') {
    return { added: [], removed: [] };
  }

  const lines = patch.split('\n');
  const added: string[] = [];
  const removed: string[] = [];

  lines.forEach((line: string) => {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      added.push(line.substring(1));
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      removed.push(line.substring(1));
    }
  });

  return { added, removed };
}

async function getRepositoryContext(context: GithubContext, app: App) {
  const { owner, repo } = context.repo();
  try {
    // Fetch README content and repository structure in parallel
    const [readmeResponse, repoStructure] = await Promise.all([
      context.octokit.repos.getReadme({
        owner,
        repo
      }),
      context.octokit.git.getTree({
        owner,
        repo,
        tree_sha: 'HEAD',
        recursive: true
      })
    ]);

    const folderStructure = repoStructure.data.tree
      .filter((item: { path: string }) => !item.path.includes('node_modules/')) // Exclude node_modules
      .map((item: { path: string }) => item.path)
      .join('\n');

    // Convert ReadmeResponse to string for compatibility with Repository type
    const readmeContent = typeof readmeResponse.data.content === 'string' 
      ? Buffer.from(readmeResponse.data.content, 'base64').toString('utf-8')
      : JSON.stringify(readmeResponse.data);

    return {
      readme: readmeContent,
      structure: folderStructure,
      name: repo,
      owner: owner
    };
  } catch (error) {
    app.log.error('Error fetching repository context:', error);
    return {
      readme: 'Failed to fetch README',
      structure: 'Failed to fetch repository structure',
      name: repo,
      owner: owner
    };
  }
}