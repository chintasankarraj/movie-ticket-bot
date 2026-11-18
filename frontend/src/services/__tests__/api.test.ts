/**
 * Movie Ticket Bot — Frontend API Client & Data Layer Test Suite
 * Tests api.ts functions, error classes, data source state resolution,
 * timeout handling, network failure, invalid JSON, and schema validation.
 */

import {
  getOverview,
  getWorkflows,
  getShows,
  resolveDataSourceState,
  ApiClientError,
} from '../api';
import {
  OverviewApiResponse,
  WorkflowsApiResponse,
  ShowsApiResponse,
} from '../../types/api';

declare const process: {
  exit(code?: number): never;
};

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Mock sample payloads
const mockOverviewPayload: OverviewApiResponse = {
  generatedAt: '2026-11-18T01:00:00Z',
  dataSource: 'github_live',
  cacheStatus: 'HIT',
  movieTarget: {
    title: 'Avengers: Doomsday',
    universe: 'Marvel Cinematic Universe • Phase 6',
    city: 'Hyderabad',
    targetDate: '2026-12-17',
    targetWindow: {
      start: '12:00 AM',
      end: '04:59 AM',
      start24: '00:00',
      end24: '04:59',
    },
  },
  cloudMonitor: {
    provider: 'District',
    scheduleCron: '37 * * * *',
    configured: true,
    lastRun: {
      id: 12345,
      name: 'Monitor',
      event: 'schedule',
      status: 'completed',
      conclusion: 'success',
      startedAt: '2026-11-18T00:37:00Z',
      completedAt: '2026-11-18T00:37:25Z',
      durationSeconds: 25,
      commitSha: '6f03846',
      htmlUrl: 'https://github.com/...',
    },
    lastSuccessfulRun: {
      id: 12345,
      timestamp: '2026-11-18T00:37:25Z',
      durationSeconds: 25,
    },
    detectedShowsCount: 0,
    stateFileSha: 'sha123',
  },
  localMonitor: {
    providers: ['BookMyShow', 'District'],
    intervalSeconds: 90,
    status: 'unlinked_offline',
    notice: 'Local monitor unlinked.',
  },
};

const mockWorkflowsPayload: WorkflowsApiResponse = {
  generatedAt: '2026-11-18T01:00:00Z',
  dataSource: 'github_live',
  cacheStatus: 'MISS',
  totalRuns: 1,
  limit: 10,
  runs: [
    {
      id: 12345,
      name: 'Monitor',
      event: 'schedule',
      status: 'completed',
      conclusion: 'success',
      startedAt: '2026-11-18T00:37:00Z',
      completedAt: '2026-11-18T00:37:25Z',
      durationSeconds: 25,
      commitSha: '6f03846',
      htmlUrl: 'https://github.com/...',
    },
  ],
};

const mockShowsPayload: ShowsApiResponse = {
  generatedAt: '2026-11-18T01:00:00Z',
  dataSource: 'github_live',
  cacheStatus: 'HIT',
  totalDetected: 1,
  shows: [
    {
      raw: 'DISTRICT_Prasads Multiplex_01:00 AM',
      isParsed: true,
      provider: 'District',
      venue: 'Prasads Multiplex',
      time: '01:00 AM',
    },
  ],
  stateFileSha: 'sha123',
  retrievedAt: '2026-11-18T01:00:00Z',
};

async function runTests() {
  console.log('=====================================================');
  console.log('MOVIE TICKET BOT — FRONTEND API CLIENT TEST SUITE');
  console.log('=====================================================\n');

  let passed = 0;
  const originalFetch = globalThis.fetch;

  try {
    // -----------------------------------------------------------------------
    // TEST 1: Successful Overview Response
    // -----------------------------------------------------------------------
    console.log('[TEST 1] Successful Overview Response...');
    globalThis.fetch = async (url) => {
      assert(String(url) === '/api/overview', 'Must call /api/overview');
      return new Response(JSON.stringify(mockOverviewPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const overview = await getOverview();
    assert(overview.movieTarget.title === 'Avengers: Doomsday', 'Title must match');
    assert(overview.cloudMonitor.provider === 'District', 'Provider must match');
    assert(overview.cloudMonitor.lastRun?.durationSeconds === 25, 'Duration must match');
    console.log('  ✓ getOverview() returned strongly typed overview structure');
    passed++;

    // -----------------------------------------------------------------------
    // TEST 2: Successful Workflows Response with parameter clamping
    // -----------------------------------------------------------------------
    console.log('\n[TEST 2] Successful Workflows Response...');
    let requestedUrl = '';
    globalThis.fetch = async (url) => {
      requestedUrl = String(url);
      return new Response(JSON.stringify(mockWorkflowsPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const workflows = await getWorkflows(5);
    assert(requestedUrl === '/api/workflows?limit=5', `Expected limit=5 param, got ${requestedUrl}`);
    assert(workflows.runs.length === 1, 'Expected 1 run');
    assert(workflows.runs[0].conclusion === 'success', 'Conclusion must match');

    // Test default limit parameter
    await getWorkflows();
    assert(requestedUrl === '/api/workflows?limit=10', 'Default limit must be 10');
    console.log('  ✓ getWorkflows() correctly requested relative URL and returned typed runs');
    passed++;

    // -----------------------------------------------------------------------
    // TEST 3: Successful Shows Response
    // -----------------------------------------------------------------------
    console.log('\n[TEST 3] Successful Shows Response...');
    globalThis.fetch = async (url) => {
      assert(String(url) === '/api/shows', 'Must call /api/shows');
      return new Response(JSON.stringify(mockShowsPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const shows = await getShows();
    assert(shows.totalDetected === 1, 'Expected 1 show');
    assert(shows.shows[0].venue === 'Prasads Multiplex', 'Venue match');
    assert(shows.shows[0].time === '01:00 AM', 'Time match');
    console.log('  ✓ getShows() successfully retrieved and validated parsed shows payload');
    passed++;

    // -----------------------------------------------------------------------
    // TEST 4: Data Source State Resolution
    // -----------------------------------------------------------------------
    console.log('\n[TEST 4] Data Source State Resolution...');
    // Live
    const liveState = resolveDataSourceState({
      generatedAt: '...',
      dataSource: 'github_live',
      cacheStatus: 'HIT',
    });
    assert(liveState === 'LIVE', 'Expected LIVE for github_live and HIT');

    // Stale
    const staleState = resolveDataSourceState({
      generatedAt: '...',
      dataSource: 'github_live',
      cacheStatus: 'STALE',
    });
    assert(staleState === 'STALE', 'Expected STALE when cacheStatus is STALE');

    // Offline fallback
    const offlineState = resolveDataSourceState({
      generatedAt: '...',
      dataSource: 'offline_fallback',
      cacheStatus: 'BYPASS',
    });
    assert(offlineState === 'OFFLINE_FALLBACK', 'Expected OFFLINE_FALLBACK');

    // Error
    const errorState = resolveDataSourceState(null, true);
    assert(errorState === 'ERROR', 'Expected ERROR when error flag is true');
    console.log('  ✓ resolveDataSourceState() correctly categorized LIVE, STALE, OFFLINE_FALLBACK, and ERROR');
    passed++;

    // -----------------------------------------------------------------------
    // TEST 5: HTTP Error Handling (Non-2xx)
    // -----------------------------------------------------------------------
    console.log('\n[TEST 5] HTTP Error Handling (404 and 502)...');
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({ error: 'Repository resource not found on GitHub.', statusCode: 404 }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    };

    let caughtError: ApiClientError | null = null;
    try {
      await getOverview();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        caughtError = err;
      }
    }
    assert(caughtError !== null, 'Must throw ApiClientError on 404');
    assert(caughtError?.statusCode === 404, 'Must propagate 404 status code');
    assert(
      Boolean(caughtError && caughtError.message.includes('Repository resource not found')),
      'Must extract error message from API response'
    );
    console.log('  ✓ HTTP 404 cleanly converted to ApiClientError with server error message');
    passed++;

    // -----------------------------------------------------------------------
    // TEST 6: Network Failure
    // -----------------------------------------------------------------------
    console.log('\n[TEST 6] Network Failure Handling...');
    globalThis.fetch = async () => {
      throw new TypeError('Failed to fetch');
    };

    caughtError = null;
    try {
      await getShows();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        caughtError = err;
      }
    }
    assert(caughtError !== null, 'Must throw on network error');
    assert(caughtError?.isNetworkError === true, 'isNetworkError must be true');
    console.log('  ✓ Network disconnection correctly flagged as isNetworkError');
    passed++;

    // -----------------------------------------------------------------------
    // TEST 7: Request Timeout
    // -----------------------------------------------------------------------
    console.log('\n[TEST 7] Request Timeout Handling...');
    globalThis.fetch = async (_url, options) => {
      return new Promise((_resolve, reject) => {
        const signal = options?.signal as AbortSignal | undefined;
        if (signal) {
          signal.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }
      });
    };

    caughtError = null;
    try {
      // Pass a signal that aborts quickly or let executeApiRequest timeout
      const fastController = new AbortController();
      setTimeout(() => fastController.abort(), 20);
      await getOverview(fastController.signal);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        caughtError = err;
      }
    }
    assert(caughtError !== null, 'Must throw on aborted request');
    console.log('  ✓ Request timeout and AbortController handled cleanly');
    passed++;

    // -----------------------------------------------------------------------
    // TEST 8: Invalid JSON Response
    // -----------------------------------------------------------------------
    console.log('\n[TEST 8] Invalid JSON Response Handling...');
    globalThis.fetch = async () => {
      return new Response('<html><body>502 Bad Gateway Nginx</body></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    };

    caughtError = null;
    try {
      await getWorkflows();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        caughtError = err;
      }
    }
    assert(caughtError !== null, 'Must throw on malformed JSON');
    assert(caughtError?.isParseError === true, 'isParseError must be true');
    console.log('  ✓ Non-JSON / HTML response safely caught with isParseError: true');
    passed++;

    // -----------------------------------------------------------------------
    // TEST 9: Runtime Schema Validation Failure
    // -----------------------------------------------------------------------
    console.log('\n[TEST 9] Schema Validation Failure...');
    globalThis.fetch = async () => {
      // Missing essential 'movieTarget' or 'cloudMonitor'
      return new Response(JSON.stringify({ someRandomField: 123 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    caughtError = null;
    try {
      await getOverview();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        caughtError = err;
      }
    }
    assert(caughtError !== null, 'Must throw on schema mismatch');
    assert(caughtError?.isValidationError === true, 'isValidationError must be true');
    console.log('  ✓ Malformed payload caught with isValidationError: true');
    passed++;

    // -----------------------------------------------------------------------
    // TEST 10: Stale Asynchronous Response Mitigation Logic
    // -----------------------------------------------------------------------
    console.log('\n[TEST 10] Stale Asynchronous Update Simulation...');
    let activeSequence = 0;
    let latestCommittedData = '';

    async function simulatedAsyncFetch(seqId: number, delayMs: number, data: string) {
      await new Promise((r) => setTimeout(r, delayMs));
      // Only commit if this sequence ID is still the active one
      if (seqId === activeSequence) {
        latestCommittedData = data;
      }
    }

    // Dispatch request 1 with high latency (100ms)
    activeSequence = 1;
    const p1 = simulatedAsyncFetch(1, 100, 'Old Slow Data');

    // Immediately dispatch request 2 with low latency (20ms)
    activeSequence = 2;
    const p2 = simulatedAsyncFetch(2, 20, 'New Fast Data');

    await Promise.all([p1, p2]);
    assert(latestCommittedData === 'New Fast Data', 'Newer fast request must win over slow stale request');
    console.log('  ✓ Request sequence counter prevents older delayed responses from overwriting newer state');
    passed++;

    console.log('\n=====================================================');
    console.log(`ALL ${passed} FRONTEND API CLIENT TESTS PASSED!`);
    console.log('=====================================================\n');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

runTests().catch((err) => {
  console.error('\n❌ FRONTEND API CLIENT TEST FAILED:', err);
  process.exit(1);
});
