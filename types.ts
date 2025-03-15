// GitHub API related types
export interface Repository {
  name: string;
  owner: string;
  readme: string;
  structure: string;
}

export interface User {
  login: string;
}

export interface Label {
  name: string;
}

export interface Comment {
  id: number;
  user: string;
  body: string;
  created_at: string;
  updated_at: string;
  url: string;
}

export interface IssueComment {
  author: string;
  body: string;
  created_at: string;
}

export interface PullRequest {
  title: string;
  body: string | null;
  user: User;
  state: string;
  draft: boolean;
  created_at: string;
  updated_at: string;
  mergeable: boolean;
  additions: number;
  deletions: number;
  changed_files: number;
  number: number;
  requested_reviewers?: User[];
  assignees?: User[];
  labels?: Label[];
  base: {
    ref: string;
    sha: string;
  };
  head: {
    ref: string;
    sha: string;
  };
}

export interface PRMetadata {
  title: string;
  body: string | null;
  author: string;
  state: string;
  draft: boolean;
  created_at: string;
  updated_at: string;
  mergeable: boolean;
  additions: number;
  deletions: number;
  changed_files: number;
  base: {
    branch: string;
    sha: string;
  };
  head: {
    branch: string;
    sha: string;
  };
}

export interface PRComments {
  issue_comments: Comment[];
  review_comments: Comment[];
}

export interface FileChange {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch: string;
}

export interface CodeChange {
  file: string;
  type: string;
  changes: {
    removed: string;
    added: string;
  };
  stats: {
    additions: number;
    deletions: number;
  };
}

export interface CodeChanges {
  summary: {
    files_changed: number;
    total_additions: number;
    total_deletions: number;
  };
  changes: CodeChange[];
}

export interface LinkedIssue {
  number: number;
  title: string;
  body: string | null;
  state: string;
  author: string;
  created_at: string;
  updated_at: string;
  labels: string[];
  assignees: string[];
  comments: IssueComment[];
}

export interface LinkedIssues {
  issues: LinkedIssue[];
  issues_count: number;
}

export interface PRData {
  metadata: PRMetadata;
  comments: PRComments;
  files: FileChange[];
  relationships: {
    requested_reviewers: string[];
    assignees: string[];
    labels: string[];
  };
  code_changes: CodeChanges;
  linked_issues: LinkedIssues | null;
  repository: Repository;
}

// GitHub API parameter and response types
export interface CreateCommentParams {
  owner: string;
  repo: string;
  issue_number: number;
  body: string;
}

export interface CommentResponse {
  id: number;
  node_id: string;
  url: string;
  html_url: string;
  body: string;
  user: User;
  created_at: string;
  updated_at: string;
}

export interface GetIssueParams {
  owner: string;
  repo: string;
  issue_number: number;
}

export interface IssueResponse {
  id: number;
  node_id: string;
  number: number;
  title: string;
  user: User;
  labels: Label[];
  state: string;
  locked: boolean;
  assignees: User[];
  body: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  url: string;
  html_url: string;
  comments: number;
}

export interface ListCommentsParams {
  owner: string;
  repo: string;
  issue_number: number;
  per_page?: number;
  page?: number;
}

export interface RemoveLabelParams {
  owner: string;
  repo: string;
  issue_number: number;
  name: string;
}

export interface AddLabelsParams {
  owner: string;
  repo: string;
  issue_number: number;
  labels: string[];
}

export interface GetReadmeParams {
  owner: string;
  repo: string;
  ref?: string;
}

export interface ReadmeResponse {
  type: string;
  encoding: string;
  size: number;
  name: string;
  path: string;
  content: string;
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
  download_url: string;
}

export interface GetContentParams {
  owner: string;
  repo: string;
  path: string;
  ref?: string;
}

export interface ContentResponse {
  type: string;
  encoding: string;
  size: number;
  name: string;
  path: string;
  content: string;
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
  download_url: string;
}

export interface CreateWorkflowDispatchParams {
  owner: string;
  repo: string;
  workflow_id: string;
  ref: string;
  inputs?: Record<string, unknown>;
}

export interface GetTreeParams {
  owner: string;
  repo: string;
  tree_sha: string;
  recursive?: boolean;
}

export interface TreeResponse {
  sha: string;
  url: string;
  tree: Array<{
    path: string;
    mode: string;
    type: string;
    sha: string;
    size?: number;
    url: string;
  }>;
  truncated: boolean;
}

export interface ListFilesParams {
  owner: string;
  repo: string;
  pull_number: number;
  per_page?: number;
  page?: number;
}

export interface ListReviewCommentsParams {
  owner: string;
  repo: string;
  pull_number: number;
  per_page?: number;
  page?: number;
}

// GitHub context types
export interface GithubContext {
  octokit: {
    issues: {
      createComment: (params: CreateCommentParams) => Promise<{ data: CommentResponse }>;
      get: (params: GetIssueParams) => Promise<{ data: IssueResponse }>;
      listComments: (params: ListCommentsParams) => Promise<{ data: CommentResponse[] }>;
      removeLabel: (params: RemoveLabelParams) => Promise<void>;
      addLabels: (params: AddLabelsParams) => Promise<{ data: Label[] }>;
    };
    pulls: {
      listFiles: (params: ListFilesParams) => Promise<{ data: FileChange[] }>;
      listReviewComments: (params: ListReviewCommentsParams) => Promise<{ data: Comment[] }>;
    };
    repos: {
      getReadme: (params: GetReadmeParams) => Promise<{ data: ReadmeResponse }>;
      getContent: (params: GetContentParams) => Promise<{ data: ContentResponse }>;
    };
    actions: {
      createWorkflowDispatch: (params: CreateWorkflowDispatchParams) => Promise<void>;
    };
    git: {
      getTree: (params: GetTreeParams) => Promise<{ data: TreeResponse }>;
    };
    paginate: <T>(method: Function, params: object) => Promise<T[]>;
  };
  repo: () => { owner: string; repo: string };
  payload: {
    pull_request: PullRequest;
  };
}

// App types
export interface App {
  log: {
    info: (message: string, context?: Record<string, unknown>) => void;
    error: (message: string, error?: Error | unknown) => void;
  };
  on?: (events: string[], callback: (context: GithubContext) => Promise<void>) => void;
}

// Rule types
export interface Rules {
  success: boolean;
  rules: string;
  error?: string;
}

// Patch parsing result
export interface PatchResult {
  added: string[];
  removed: string[];
}

// Configuration types
export interface Config {
  useCase: string;
  apiEndpoint: string;
  selectedModel: string;
}

// Model related types
export interface Model {
  name: string;
  link: string;
}

export interface UseCase {
  name: string;
  suggestedModels: Model[];
}

export interface UseCaseModels {
  [key: string]: UseCase;
} 