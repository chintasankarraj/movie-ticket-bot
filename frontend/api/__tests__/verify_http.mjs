/**
 * Movie Ticket Bot — Phase 4.2 End-to-End HTTP Integration Test
 * Verifies live HTTP responses from the local serverless proxy middleware (Vite).
 */

const BASE_URL = 'http://localhost:5173';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runHttpTests() {
  console.log('=====================================================');
  console.log('MOVIE TICKET BOT — LOCAL PROXY HTTP INTEGRATION TEST');
  console.log('=====================================================\n');

  let passed = 0;

  // 1. GET /api/overview
  console.log('[HTTP 1] GET /api/overview...');
  const resOverview = await fetch(`${BASE_URL}/api/overview`);
  assert(resOverview.status === 200, `Expected 200, got ${resOverview.status}`);
  assert(resOverview.headers.get('content-type')?.includes('application/json'), 'Expected application/json');
  assert(resOverview.headers.get('x-content-type-options') === 'nosniff', 'Expected nosniff');
  const dataOverview = await resOverview.json();
  assert(dataOverview.dataSource === 'offline_fallback', 'Expected offline_fallback without PAT');
  assert(dataOverview.movieTarget.title === 'Avengers: Doomsday', 'Target movie match');
  assert(dataOverview.movieTarget.city === 'Hyderabad', 'City match');
  console.log('  ✓ /api/overview returned 200 with valid schema');
  passed++;

  // 2. GET /api/workflows
  console.log('\n[HTTP 2] GET /api/workflows...');
  const resWorkflows = await fetch(`${BASE_URL}/api/workflows?limit=5`);
  assert(resWorkflows.status === 200, `Expected 200, got ${resWorkflows.status}`);
  const dataWorkflows = await resWorkflows.json();
  assert(dataWorkflows.limit === 5, 'Expected limit 5');
  assert(Array.isArray(dataWorkflows.runs), 'Expected runs array');
  console.log('  ✓ /api/workflows returned 200 with limit: 5');
  passed++;

  // 3. GET /api/shows
  console.log('\n[HTTP 3] GET /api/shows...');
  const resShows = await fetch(`${BASE_URL}/api/shows`);
  assert(resShows.status === 200, `Expected 200, got ${resShows.status}`);
  const dataShows = await resShows.json();
  assert(Array.isArray(dataShows.shows), 'Expected shows array');
  assert(dataShows.totalDetected === 0, 'Expected 0 detected in offline mode');
  console.log('  ✓ /api/shows returned 200 with empty array');
  passed++;

  // 4. Method not allowed (POST /api/overview)
  console.log('\n[HTTP 4] POST /api/overview (Rejection Test)...');
  const resPost = await fetch(`${BASE_URL}/api/overview`, { method: 'POST' });
  assert(resPost.status === 405, `Expected 405, got ${resPost.status}`);
  assert(resPost.headers.get('allow') === 'GET', 'Expected allow: GET');
  console.log('  ✓ POST correctly rejected with 405 Method Not Allowed');
  passed++;

  console.log('\n=====================================================');
  console.log(`ALL ${passed} HTTP INTEGRATION TESTS PASSED!`);
  console.log('=====================================================\n');
}

runHttpTests().catch((err) => {
  console.error('HTTP Test Failure:', err);
  process.exit(1);
});
