/**
 * GET /api/shows
 * Returns detected midnight show records parsed directly from cloud_seen_shows.json
 */

import {
  ShowsApiResponse,
  ParsedShowEntry,
  ApiErrorResponse,
} from './_lib/types';
import { memoryCache } from './_lib/cache';
import {
  fetchCloudSeenShowsFile,
  getGitHubToken,
  GitHubApiError,
} from './_lib/github';

/**
 * Parses raw deduplication keys such as:
 * - "DISTRICT_Prasads Multiplex_01:00 AM"
 * - "BMS_AMB Cinemas_12:15 AM"
 * Does not invent missing metadata.
 */
function parseDeduplicationKey(raw: string): ParsedShowEntry {
  if (typeof raw !== 'string' || !raw.trim()) {
    return {
      raw: String(raw),
      isParsed: false,
      provider: 'Unknown',
    };
  }

  // Regex to match Provider_Venue_Time pattern
  const match = raw.match(/^(DISTRICT|BMS)_(.+)_(1?\d:[0-5]\d\s*(?:AM|PM|am|pm))$/i);
  if (match) {
    const providerTag = match[1].toUpperCase();
    const provider =
      providerTag === 'DISTRICT'
        ? 'District'
        : providerTag === 'BMS'
        ? 'BookMyShow'
        : 'Unknown';

    return {
      raw,
      isParsed: true,
      provider,
      venue: match[2].trim(),
      time: match[3].trim(),
    };
  }

  // If cannot be parsed confidently, return unclassified raw entry
  return {
    raw,
    isParsed: false,
    provider: raw.startsWith('DISTRICT_')
      ? 'District'
      : raw.startsWith('BMS_')
      ? 'BookMyShow'
      : 'Unknown',
  };
}

export async function handleShowsRequest(request?: Request): Promise<Response> {
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

  const cacheKey = 'api:shows';
  const cached = memoryCache.get<ShowsApiResponse>(cacheKey);

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
    const offlinePayload: ShowsApiResponse = {
      generatedAt: new Date().toISOString(),
      dataSource: 'offline_fallback',
      cacheStatus: 'BYPASS',
      totalDetected: 0,
      shows: [],
      stateFileSha: null,
      retrievedAt: new Date().toISOString(),
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
    const { sha, shows: rawShows } = await fetchCloudSeenShowsFile();
    const parsedShows: ParsedShowEntry[] = rawShows.map(parseDeduplicationKey);

    const payload: ShowsApiResponse = {
      generatedAt: new Date().toISOString(),
      dataSource: 'github_live',
      cacheStatus: cached?.status === 'STALE' ? 'STALE' : 'MISS',
      totalDetected: parsedShows.length,
      shows: parsedShows,
      stateFileSha: sha,
      retrievedAt: new Date().toISOString(),
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
    const staleFallback = memoryCache.getFallbackOnFailure<ShowsApiResponse>(cacheKey);
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
        : 'Failed to retrieve detected shows from GitHub.';

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
  return handleShowsRequest(request);
}

// Default export compatible with Node HTTP server / Vite dev server middleware
export default async function handler(req: any, res: any): Promise<void> {
  const protocol = req.headers?.['x-forwarded-proto'] || 'http';
  const host = req.headers?.['host'] || 'localhost';
  const url = `${protocol}://${host}${req.url || '/api/shows'}`;
  const request = new Request(url, {
    method: req.method || 'GET',
    headers: req.headers,
  });

  const response = await handleShowsRequest(request);

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const text = await response.text();
  res.end(text);
}
