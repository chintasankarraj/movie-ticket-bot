/**
 * Movie Ticket Bot — Frontend API Client Service
 * Strongly typed client accessing same-origin serverless proxy endpoints.
 * Never connects to GitHub directly; never exposes credentials.
 */

import {
  OverviewApiResponse,
  WorkflowsApiResponse,
  ShowsApiResponse,
  ApiErrorResponse,
  ClientDataSourceState,
  ApiResponseMeta,
} from '../types/api';

const DEFAULT_TIMEOUT_MS = 8000;

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly isTimeout: boolean = false,
    public readonly isNetworkError: boolean = false,
    public readonly isParseError: boolean = false,
    public readonly isValidationError: boolean = false,
    public readonly rawDetails?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Resolves the client data-source state from API metadata.
 * Explicitly distinguishes genuine GitHub telemetry from cached stale data,
 * offline fallback mode, and active error states.
 */
export function resolveDataSourceState(
  meta?: ApiResponseMeta | null,
  isError: boolean = false
): ClientDataSourceState {
  if (isError || !meta) {
    return 'ERROR';
  }
  if (meta.dataSource === 'offline_fallback') {
    return 'OFFLINE_FALLBACK';
  }
  if (meta.cacheStatus === 'STALE') {
    return 'STALE';
  }
  if (meta.dataSource === 'github_live') {
    return 'LIVE';
  }
  return 'OFFLINE_FALLBACK';
}

/**
 * Internal helper to execute a fetch request with timeout, signal combination,
 * status validation, and safe JSON extraction.
 */
async function executeApiRequest<T>(
  endpoint: string,
  userSignal?: AbortSignal,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // If caller provided a signal that aborts, forward it
  if (userSignal) {
    if (userSignal.aborted) {
      clearTimeout(timer);
      controller.abort();
    } else {
      userSignal.addEventListener('abort', () => {
        clearTimeout(timer);
        controller.abort();
      });
    }
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timer);

    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        const wasUserAborted = userSignal?.aborted;
        if (wasUserAborted) {
          throw new ApiClientError('Request aborted by caller.', undefined, false, false, false, false);
        }
        throw new ApiClientError(
          `Request to ${endpoint} timed out after ${timeoutMs}ms.`,
          undefined,
          true,
          false,
          false,
          false
        );
      }
      throw new ApiClientError(
        `Network error while contacting ${endpoint}: ${err.message}`,
        undefined,
        false,
        true,
        false,
        false,
        err
      );
    }
    throw new ApiClientError('Unknown network failure occurred.', undefined, false, true);
  } finally {
    clearTimeout(timer);
  }

  // Handle non-2xx HTTP responses
  if (!response.ok) {
    let errorPayload: ApiErrorResponse | null = null;
    let rawText = '';
    try {
      rawText = await response.text();
      errorPayload = JSON.parse(rawText) as ApiErrorResponse;
    } catch {
      // Body wasn't JSON
    }

    const message =
      errorPayload?.error ||
      `HTTP ${response.status}: ${response.statusText || 'Request failed'}`;

    throw new ApiClientError(
      message,
      response.status,
      false,
      false,
      false,
      false,
      errorPayload || rawText
    );
  }

  // Safe JSON extraction
  let parsedJson: unknown;
  try {
    parsedJson = await response.json();
  } catch (err: unknown) {
    throw new ApiClientError(
      `Failed to parse JSON response from ${endpoint}.`,
      response.status,
      false,
      false,
      true,
      false,
      err
    );
  }

  return parsedJson as T;
}

// ---------------------------------------------------------------------------
// Runtime Schema Validators
// ---------------------------------------------------------------------------

function validateOverviewResponse(data: unknown): OverviewApiResponse {
  if (!data || typeof data !== 'object') {
    throw new ApiClientError('Invalid Overview payload: expected an object.', 200, false, false, false, true);
  }
  const obj = data as Partial<OverviewApiResponse>;
  if (!obj.dataSource || !obj.movieTarget || !obj.cloudMonitor || !obj.localMonitor) {
    throw new ApiClientError(
      'Invalid Overview payload: missing essential root properties.',
      200,
      false,
      false,
      false,
      true,
      data
    );
  }
  if (typeof obj.movieTarget.title !== 'string' || typeof obj.cloudMonitor.provider !== 'string') {
    throw new ApiClientError(
      'Invalid Overview payload: malformed movieTarget or cloudMonitor structure.',
      200,
      false,
      false,
      false,
      true,
      data
    );
  }
  return data as OverviewApiResponse;
}

function validateWorkflowsResponse(data: unknown): WorkflowsApiResponse {
  if (!data || typeof data !== 'object') {
    throw new ApiClientError('Invalid Workflows payload: expected an object.', 200, false, false, false, true);
  }
  const obj = data as Partial<WorkflowsApiResponse>;
  if (!Array.isArray(obj.runs) || typeof obj.totalRuns !== 'number') {
    throw new ApiClientError(
      'Invalid Workflows payload: missing runs array or totalRuns count.',
      200,
      false,
      false,
      false,
      true,
      data
    );
  }
  return data as WorkflowsApiResponse;
}

function validateShowsResponse(data: unknown): ShowsApiResponse {
  if (!data || typeof data !== 'object') {
    throw new ApiClientError('Invalid Shows payload: expected an object.', 200, false, false, false, true);
  }
  const obj = data as Partial<ShowsApiResponse>;
  if (!Array.isArray(obj.shows) || typeof obj.totalDetected !== 'number') {
    throw new ApiClientError(
      'Invalid Shows payload: missing shows array or totalDetected count.',
      200,
      false,
      false,
      false,
      true,
      data
    );
  }
  return data as ShowsApiResponse;
}

// ---------------------------------------------------------------------------
// Public API Functions
// ---------------------------------------------------------------------------

/**
 * Retrieve real-time monitoring telemetry overview combining GitHub Actions runner
 * status, cloud seen show count, and movie target metadata.
 */
export async function getOverview(signal?: AbortSignal): Promise<OverviewApiResponse> {
  const raw = await executeApiRequest<unknown>('/api/overview', signal);
  return validateOverviewResponse(raw);
}

/**
 * Retrieve verified GitHub Actions workflow execution runs for the cloud runner.
 * @param limit Optional limit clamped to 1..25 by proxy (defaults to 10)
 */
export async function getWorkflows(
  limit: number = 10,
  signal?: AbortSignal
): Promise<WorkflowsApiResponse> {
  const safeLimit = Math.min(Math.max(1, limit), 25);
  const raw = await executeApiRequest<unknown>(`/api/workflows?limit=${safeLimit}`, signal);
  return validateWorkflowsResponse(raw);
}

/**
 * Retrieve detected midnight show records parsed directly from cloud_seen_shows.json.
 */
export async function getShows(signal?: AbortSignal): Promise<ShowsApiResponse> {
  const raw = await executeApiRequest<unknown>('/api/shows', signal);
  return validateShowsResponse(raw);
}
