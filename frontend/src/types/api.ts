/**
 * Movie Ticket Bot — Frontend API Data Contracts
 * Explicit client-side types corresponding to Phase 4.2 Serverless API contracts.
 * Strictly decoupled from serverless backend runtime dependencies.
 */

export type DataSource = 'github_live' | 'cached' | 'offline_fallback';
export type CacheStatus = 'HIT' | 'MISS' | 'STALE' | 'BYPASS';

/**
 * Resolved high-level client data-source state.
 * Explicitly distinguishes genuine GitHub telemetry from cached stale data,
 * offline fallback mode, or active error states.
 */
export type ClientDataSourceState = 'LIVE' | 'STALE' | 'OFFLINE_FALLBACK' | 'ERROR';

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
 * Generic container state returned by React data hooks
 */
export interface AsyncDataState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  dataSource: ClientDataSourceState;
  lastFetchedAt: string | null;
  refresh: () => Promise<void>;
}
