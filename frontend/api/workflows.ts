/**
 * GET /api/workflows
 * Returns verified GitHub Actions workflow runs for the cloud monitoring runner
 */

import {
  WorkflowsApiResponse,
  WorkflowRunSummary,
  ApiErrorResponse,
} from './_lib/types';
import { memoryCache } from './_lib/cache';
import {
  fetchWorkflowRuns,
  getGitHubToken,
  GitHubApiError,
} from './_lib/github';

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

function parseLimitParam(urlStr?: string): number {
  if (!urlStr) return 10;
  try {
    const url = new URL(urlStr, 'http://localhost');
    const limitParam = url.searchParams.get('limit');
    if (!limitParam) return 10;
    const parsed = parseInt(limitParam, 10);
    if (isNaN(parsed) || parsed < 1) return 10;
    return Math.min(Math.max(parsed, 1), 25);
  } catch {
    return 10;
  }
}

export async function handleWorkflowsRequest(request?: Request): Promise<Response> {
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

  const limit = parseLimitParam(request?.url);
  const cacheKey = `api:workflows:limit:${limit}`;
  const cached = memoryCache.get<WorkflowsApiResponse>(cacheKey);

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
    const offlinePayload: WorkflowsApiResponse = {
      generatedAt: new Date().toISOString(),
      dataSource: 'offline_fallback',
      cacheStatus: 'BYPASS',
      totalRuns: 0,
      limit,
      runs: [],
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
    const { runs, total } = await fetchWorkflowRuns(limit);

    const mappedRuns: WorkflowRunSummary[] = runs.map((run) => {
      const startTime = run.run_started_at || run.created_at;
      return {
        id: run.id,
        name: run.name,
        event: run.event,
        status: run.status,
        conclusion: run.conclusion,
        startedAt: startTime,
        completedAt: run.conclusion ? run.updated_at : null,
        durationSeconds: calculateDurationSeconds(startTime, run.updated_at),
        commitSha: run.head_sha ? run.head_sha.substring(0, 7) : '',
        htmlUrl: run.html_url,
      };
    });

    const payload: WorkflowsApiResponse = {
      generatedAt: new Date().toISOString(),
      dataSource: 'github_live',
      cacheStatus: cached?.status === 'STALE' ? 'STALE' : 'MISS',
      totalRuns: total,
      limit,
      runs: mappedRuns,
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
    const staleFallback = memoryCache.getFallbackOnFailure<WorkflowsApiResponse>(cacheKey);
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
        : 'Failed to retrieve workflow runs from GitHub Actions.';

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
  return handleWorkflowsRequest(request);
}

// Default export compatible with Node HTTP server / Vite dev server middleware
export default async function handler(req: any, res: any): Promise<void> {
  const protocol = req.headers?.['x-forwarded-proto'] || 'http';
  const host = req.headers?.['host'] || 'localhost';
  const url = `${protocol}://${host}${req.url || '/api/workflows'}`;
  const request = new Request(url, {
    method: req.method || 'GET',
    headers: req.headers,
  });

  const response = await handleWorkflowsRequest(request);

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const text = await response.text();
  res.end(text);
}
