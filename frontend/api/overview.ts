/**
 * GET /api/overview
 * Real-time monitoring telemetry overview combining GitHub Actions status & cloud seen state
 */

import {
  OverviewApiResponse,
  WorkflowRunSummary,
  ApiErrorResponse,
} from './_lib/types.js';
import {
  MOVIE_TARGET,
  CLOUD_MONITOR_SPEC,
  LOCAL_MONITOR_SPEC,
} from './_lib/config.js';
import { memoryCache } from './_lib/cache.js';
import {
  fetchWorkflowRuns,
  fetchCloudSeenShowsFile,
  getGitHubToken,
  GitHubApiError,
} from './_lib/github.js';

function calculateDurationSeconds(
  startStr?: string,
  endStr?: string
): number | null {
  if (!startStr || !endStr) return null;
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return null;
  return Math.round((end - start) / 1000);
}

export async function handleOverviewRequest(request?: Request): Promise<Response> {
  // Method Validation (GET only)
  if (request && request.method !== 'GET') {
    const errorBody: ApiErrorResponse = {
      error: 'Method Not Allowed. Only GET requests are permitted.',
      statusCode: 405,
      generatedAt: new Date().toISOString(),
    };
    return new Response(JSON.stringify(errorBody), {
      status: 405,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Allow': 'GET',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  const cacheKey = 'api:overview';
  const cached = memoryCache.get<OverviewApiResponse>(cacheKey);

  if (cached && cached.status === 'HIT') {
    const responsePayload = {
      ...cached.data,
      cacheStatus: 'HIT' as const,
    };
    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-Cache': 'HIT',
      },
    });
  }

  // Check if GITHUB_PAT is configured
  const token = getGitHubToken();
  if (!token) {
    const offlinePayload: OverviewApiResponse = {
      generatedAt: new Date().toISOString(),
      dataSource: 'offline_fallback',
      cacheStatus: 'BYPASS',
      movieTarget: MOVIE_TARGET,
      cloudMonitor: {
        provider: CLOUD_MONITOR_SPEC.PROVIDER,
        scheduleCron: CLOUD_MONITOR_SPEC.SCHEDULE_CRON,
        configured: false,
        lastRun: null,
        lastSuccessfulRun: null,
        detectedShowsCount: 0,
        stateFileSha: null,
      },
      localMonitor: LOCAL_MONITOR_SPEC,
    };

    return new Response(JSON.stringify(offlinePayload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Cache': 'BYPASS',
      },
    });
  }

  try {
    // Parallel fetch of workflow runs and state file
    const [runsResult, stateResult] = await Promise.all([
      fetchWorkflowRuns(5),
      fetchCloudSeenShowsFile(),
    ]);

    const latestRunRaw = runsResult.runs[0] || null;
    let latestRun: WorkflowRunSummary | null = null;

    if (latestRunRaw) {
      const startTime = latestRunRaw.run_started_at || latestRunRaw.created_at;
      latestRun = {
        id: latestRunRaw.id,
        name: latestRunRaw.name,
        event: latestRunRaw.event,
        status: latestRunRaw.status,
        conclusion: latestRunRaw.conclusion,
        startedAt: startTime,
        completedAt: latestRunRaw.conclusion ? latestRunRaw.updated_at : null,
        durationSeconds: calculateDurationSeconds(startTime, latestRunRaw.updated_at),
        commitSha: latestRunRaw.head_sha ? latestRunRaw.head_sha.substring(0, 7) : '',
        htmlUrl: latestRunRaw.html_url,
      };
    }

    const latestSuccessRaw =
      runsResult.runs.find((r) => r.conclusion === 'success') || null;

    const lastSuccessfulRun = latestSuccessRaw
      ? {
          id: latestSuccessRaw.id,
          timestamp: latestSuccessRaw.updated_at,
          durationSeconds: calculateDurationSeconds(
            latestSuccessRaw.run_started_at || latestSuccessRaw.created_at,
            latestSuccessRaw.updated_at
          ),
        }
      : null;

    const payload: OverviewApiResponse = {
      generatedAt: new Date().toISOString(),
      dataSource: 'github_live',
      cacheStatus: cached?.status === 'STALE' ? 'STALE' : 'MISS',
      movieTarget: MOVIE_TARGET,
      cloudMonitor: {
        provider: CLOUD_MONITOR_SPEC.PROVIDER,
        scheduleCron: CLOUD_MONITOR_SPEC.SCHEDULE_CRON,
        configured: true,
        lastRun: latestRun,
        lastSuccessfulRun,
        detectedShowsCount: stateResult.shows.length,
        stateFileSha: stateResult.sha,
      },
      localMonitor: LOCAL_MONITOR_SPEC,
    };

    memoryCache.set(cacheKey, payload);

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-Cache': cached?.status === 'STALE' ? 'STALE' : 'MISS',
      },
    });
  } catch (error: unknown) {
    // If upstream failed but we have stale cache, return stale cache rather than failing
    const staleFallback = memoryCache.getFallbackOnFailure<OverviewApiResponse>(cacheKey);
    if (staleFallback) {
      const fallbackPayload = {
        ...staleFallback,
        cacheStatus: 'STALE' as const,
      };
      return new Response(JSON.stringify(fallbackPayload), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, s-maxage=30',
          'X-Content-Type-Options': 'nosniff',
          'X-Cache': 'STALE',
          'Warning': '110 - "Response is Stale: Upstream GitHub Request Failed"',
        },
      });
    }

    const statusCode = error instanceof GitHubApiError ? error.statusCode : 502;
    const message =
      error instanceof GitHubApiError
        ? error.publicMessage
        : 'Failed to retrieve overview telemetry from GitHub.';

    const errorBody: ApiErrorResponse = {
      error: message,
      statusCode,
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(errorBody), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }
}

// Standard Web GET export
export async function GET(request: Request): Promise<Response> {
  return handleOverviewRequest(request);
}

// Default export compatible with Node HTTP server / Vite dev server middleware
export default async function handler(req: any, res: any): Promise<void> {
  const protocol = req.headers?.['x-forwarded-proto'] || 'http';
  const host = req.headers?.['host'] || 'localhost';
  const url = `${protocol}://${host}${req.url || '/api/overview'}`;
  const request = new Request(url, {
    method: req.method || 'GET',
    headers: req.headers,
  });

  const response = await handleOverviewRequest(request);

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const text = await response.text();
  res.end(text);
}
