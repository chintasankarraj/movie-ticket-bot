/**
 * Movie Ticket Bot — Serverless API Types
 * Strict domain contracts for read-only GitHub API proxy
 */

export type DataSource = 'github_live' | 'cached' | 'offline_fallback';
export type CacheStatus = 'HIT' | 'MISS' | 'STALE' | 'BYPASS';

export interface ApiResponseMeta {
  generatedAt: string;
  dataSource: DataSource;
  cacheStatus: CacheStatus;
  upstreamStatusCode?: number;
}

export interface MovieTargetConfig {
  title: string;
  universe: string;
  city: string;
  targetDate: string;
  targetWindow: {
    start: string;
    end: string;
    start24: string;
    end24: string;
  };
}

export interface WorkflowRunSummary {
  id: number;
  name: string;
  event: string;
  status: string;
  conclusion: string | null;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  commitSha: string;
  htmlUrl: string;
}

export interface OverviewApiResponse extends ApiResponseMeta {
  movieTarget: MovieTargetConfig;
  cloudMonitor: {
    provider: 'District';
    scheduleCron: string;
    configured: boolean;
    lastRun: WorkflowRunSummary | null;
    lastSuccessfulRun: {
      id: number;
      timestamp: string;
      durationSeconds: number | null;
    } | null;
    detectedShowsCount: number;
    stateFileSha: string | null;
  };
  localMonitor: {
    providers: ['BookMyShow', 'District'];
    intervalSeconds: number;
    status: 'unlinked_offline';
    notice: string;
  };
}

export interface WorkflowsApiResponse extends ApiResponseMeta {
  totalRuns: number;
  limit: number;
  runs: WorkflowRunSummary[];
}

export interface ParsedShowEntry {
  raw: string;
  isParsed: boolean;
  provider: 'District' | 'BookMyShow' | 'Unknown';
  venue?: string;
  time?: string;
}

export interface ShowsApiResponse extends ApiResponseMeta {
  totalDetected: number;
  shows: ParsedShowEntry[];
  stateFileSha: string | null;
  retrievedAt: string;
}

export interface ApiErrorResponse {
  error: string;
  statusCode: number;
  generatedAt: string;
  details?: string;
}

/**
 * Minimal Raw GitHub API contracts (selected fields only)
 */
export interface GitHubWorkflowRunRaw {
  id: number;
  name: string;
  event: string;
  status: string;
  conclusion: string | null;
  run_started_at?: string;
  created_at: string;
  updated_at: string;
  head_sha: string;
  html_url: string;
}

export interface GitHubRunsResponseRaw {
  total_count: number;
  workflow_runs: GitHubWorkflowRunRaw[];
}

export interface GitHubContentFileRaw {
  name: string;
  path: string;
  sha: string;
  size: number;
  content?: string;
  encoding?: string;
}
