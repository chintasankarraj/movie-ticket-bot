/**
 * Movie Ticket Bot — Secure GitHub API Client
 * Read-only, hardcoded repository client with token sanitization and rate-limit safety
 */

import { GITHUB_CONFIG, CLOUD_MONITOR_SPEC } from './config';
import {
  GitHubRunsResponseRaw,
  GitHubWorkflowRunRaw,
  GitHubContentFileRaw,
} from './types';

// Declare Node's process.env safely without requiring @types/node
declare const process: {
  env: Record<string, string | undefined>;
};

export class GitHubApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly publicMessage: string,
    public readonly rateLimitRemaining?: number
  ) {
    super(publicMessage);
    this.name = 'GitHubApiError';
  }
}

/**
 * Retrieves GITHUB_PAT from server environment.
 * NEVER exposed to client.
 */
export function getGitHubToken(): string | null {
  const token = process.env.GITHUB_PAT?.trim();
  return token && token.length > 0 ? token : null;
}

/**
 * Generic sanitized GitHub API request
 */
async function fetchFromGitHub<T>(path: string): Promise<T> {
  const token = getGitHubToken();
  const url = `${GITHUB_CONFIG.API_BASE}${path}`;

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': GITHUB_CONFIG.API_VERSION,
    'User-Agent': GITHUB_CONFIG.USER_AGENT,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GITHUB_CONFIG.TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rateLimitRemaining = response.headers.get('x-ratelimit-remaining')
      ? parseInt(response.headers.get('x-ratelimit-remaining')!, 10)
      : undefined;

    if (!response.ok) {
      if (response.status === 401) {
        throw new GitHubApiError(
          401,
          'GitHub authentication failed. Please verify server-side GITHUB_PAT.',
          rateLimitRemaining
        );
      }
      if (response.status === 403) {
        if (rateLimitRemaining === 0) {
          throw new GitHubApiError(
            429,
            'GitHub API rate limit exhausted. Serving cached data where available.',
            rateLimitRemaining
          );
        }
        throw new GitHubApiError(
          403,
          'GitHub access forbidden. Confirm fine-grained PAT repository access.',
          rateLimitRemaining
        );
      }
      if (response.status === 404) {
        throw new GitHubApiError(
          404,
          'Repository or resource not found on GitHub.',
          rateLimitRemaining
        );
      }
      if (response.status >= 500) {
        throw new GitHubApiError(
          502,
          'Upstream GitHub API service is currently unavailable.',
          rateLimitRemaining
        );
      }

      throw new GitHubApiError(
        response.status,
        `Upstream GitHub request failed with status HTTP ${response.status}.`,
        rateLimitRemaining
      );
    }

    return (await response.json()) as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof GitHubApiError) {
      throw err;
    }

    if (err instanceof Error && err.name === 'AbortError') {
      throw new GitHubApiError(504, 'Upstream GitHub API request timed out.');
    }

    throw new GitHubApiError(500, 'Network error while contacting GitHub API.');
  }
}

/**
 * Fetch latest GitHub Actions workflow runs for the movie ticket monitor
 */
export async function fetchWorkflowRuns(
  limit: number = 10
): Promise<{ runs: GitHubWorkflowRunRaw[]; total: number }> {
  const safeLimit = Math.min(Math.max(1, limit), 25);
  const path = `/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/actions/runs?per_page=${safeLimit}`;

  const data = await fetchFromGitHub<GitHubRunsResponseRaw>(path);
  return {
    runs: data.workflow_runs || [],
    total: data.total_count || 0,
  };
}

/**
 * Fetch and decode cloud_seen_shows.json directly from repository contents
 */
export async function fetchCloudSeenShowsFile(): Promise<{
  sha: string;
  shows: string[];
}> {
  const path = `/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/${CLOUD_MONITOR_SPEC.STATE_FILE_PATH}`;

  const fileData = await fetchFromGitHub<GitHubContentFileRaw>(path);
  let shows: string[] = [];

  if (fileData.content) {
    try {
      // Decode base64 content
      const rawText = atob(fileData.content.replace(/\s/g, ''));
      const parsed = JSON.parse(rawText);
      if (Array.isArray(parsed)) {
        shows = parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      // If parsing fails, return empty list rather than inventing data
      shows = [];
    }
  }

  return {
    sha: fileData.sha || '',
    shows,
  };
}
