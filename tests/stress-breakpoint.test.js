/**
 * k6 Stress Test: Find Breaking Point
 *
 * This test progressively increases virtual users to find the system's
 * maximum capacity while maintaining SLA (p95 < 2000ms).
 *
 * VU Progression: 5 → 10 → 25 → 50 → 75 → 100 → 150 → 200
 *
 * Usage:
 *   k6 run tests/stress-breakpoint.test.js
 *   k6 run --out json=results/stress.json tests/stress-breakpoint.test.js
 *
 * Prerequisites:
 *   - Start bot with: LOAD_TEST_MODE=true npm start
 *   - Set BOT_ENDPOINT in .env
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Load bot endpoint from environment
const BOT_ENDPOINT = __ENV.BOT_ENDPOINT || 'http://localhost:3978/api/messages';

console.log(`Bot endpoint: ${BOT_ENDPOINT}`);

// Custom metrics
const errorRate = new Rate('errors');
const successRate = new Rate('success_rate');
const responseTrend = new Trend('response_time_trend');
const requestCount = new Counter('total_requests');

// Test configuration - Progressive stress test
export const options = {
  stages: [
    // Phase 1: Baseline (5 VUs)
    { duration: '30s', target: 5 },
    { duration: '1m', target: 5 },

    // Phase 2: First doubling (10 VUs)
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },

    // Phase 3: Moderate load (25 VUs)
    { duration: '30s', target: 25 },
    { duration: '1m', target: 25 },

    // Phase 4: Heavy load (50 VUs)
    { duration: '30s', target: 50 },
    { duration: '1m', target: 50 },

    // Phase 5: Approaching limits (75 VUs)
    { duration: '30s', target: 75 },
    { duration: '1m', target: 75 },

    // Phase 6: Stress load (100 VUs)
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },

    // Phase 7: Peak load (150 VUs)
    { duration: '30s', target: 150 },
    { duration: '1m', target: 150 },

    // Phase 8: Overload (200 VUs)
    { duration: '30s', target: 200 },
    { duration: '1m', target: 200 },

    // Ramp down
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    // SLA: p95 < 10s (10000ms) - adjusted for n8n workflow processing time
    http_req_duration: [{ threshold: 'p(95)<10000', abortOnFail: true }],
    // Error rate < 1% - abort if breached
    http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true }],
    // Custom error tracking
    errors: ['rate<0.05'],
  },
  tags: {
    test_type: 'stress',
    test_name: 'breakpoint-finder',
  },
  // Summary output
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

/**
 * Helper function to create a Bot Framework Activity
 */
function createActivity(text = 'stress test') {
  const activityId = `stress-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const conversationId = `stress-conversation-${Date.now()}-${__VU}`;

  return {
    type: 'message',
    id: activityId,
    timestamp: new Date().toISOString(),
    channelId: 'msteams',

    from: {
      id: __ENV.TEST_USER_ID || '29:load-test-user',
      name: __ENV.TEST_USER_NAME || 'Load Test User',
      aadObjectId: __ENV.TEST_USER_AAD_OBJECT_ID || '45908692-019e-4436-810c-b417f58f5f4f',
      role: 'user',
    },

    recipient: {
      id: 'workoflow-bot',
      name: 'Workoflow Bot',
      role: 'bot',
    },

    conversation: {
      id: conversationId,
      conversationType: 'personal',
      isGroup: false,
      tenantId: 'ae6f26a3-6f27-4ed6-a3a8-800c3226fb79',
    },

    text: text,
    textFormat: 'plain',
    locale: 'en-US',

    serviceUrl: __ENV.SERVICE_URL || 'https://smba.trafficmanager.net/teams',
  };
}

/**
 * Determine current phase based on VU count
 */
function getCurrentPhase() {
  const vus = __VU;
  if (vus <= 5) return 'phase1-5vu';
  if (vus <= 10) return 'phase2-10vu';
  if (vus <= 25) return 'phase3-25vu';
  if (vus <= 50) return 'phase4-50vu';
  if (vus <= 75) return 'phase5-75vu';
  if (vus <= 100) return 'phase6-100vu';
  if (vus <= 150) return 'phase7-150vu';
  return 'phase8-200vu';
}

/**
 * Main test function - executed by each virtual user
 */
export default function () {
  const phase = getCurrentPhase();

  // Create activity
  const activity = createActivity(__ENV.TEST_MESSAGE || 'stress test');

  // Prepare request
  const payload = JSON.stringify(activity);
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': __ENV.LOAD_TEST_API_KEY || '',
  };

  const params = {
    headers: headers,
    tags: {
      name: 'SendMessage',
      phase: phase,
    },
  };

  // Send request
  const response = http.post(BOT_ENDPOINT, payload, params);

  // Track metrics
  requestCount.add(1);
  responseTrend.add(response.timings.duration);

  // Check response
  const success = check(response, {
    'status is 200 or 202': (r) => r.status === 200 || r.status === 202,
    'response time < 10s': (r) => r.timings.duration < 10000,
  });

  // Track success/error rates
  successRate.add(success);
  errorRate.add(!success);

  // Log errors for debugging
  if (!success) {
    console.error(`[${phase}] Request failed: ${response.status} - ${response.body?.substring(0, 200)}`);
  }

  // Think time between requests (randomized to simulate real users)
  sleep(Math.random() * 0.5 + 0.5); // 0.5-1s think time
}

/**
 * Setup function - runs once before the test starts
 */
export function setup() {
  console.log(`
================================================================================
                    STRESS TEST: FIND BREAKING POINT
================================================================================
Endpoint: ${BOT_ENDPOINT}
SLA: p95 < 10s (adjusted for n8n workflow processing), Error rate < 1%

VU Progression:
  Phase 1: 5 VUs    (baseline)
  Phase 2: 10 VUs   (first doubling)
  Phase 3: 25 VUs   (moderate load)
  Phase 4: 50 VUs   (heavy load)
  Phase 5: 75 VUs   (approaching limits)
  Phase 6: 100 VUs  (stress load)
  Phase 7: 150 VUs  (peak load)
  Phase 8: 200 VUs  (overload test)

Test will ABORT automatically if SLA is breached!
================================================================================
`);

  return { startTime: new Date() };
}

/**
 * Teardown function - runs once after the test completes
 */
export function teardown(data) {
  const duration = (new Date() - data.startTime) / 1000;
  console.log(`
================================================================================
                          TEST COMPLETED
================================================================================
Total Duration: ${duration.toFixed(2)}s

Check results with:
  - Summary above for quick metrics
  - JSON output file for detailed analysis

If test aborted early, the breaking point has been found!
================================================================================
`);
}

/**
 * Handle summary - custom summary generation
 */
export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  return {
    'stdout': textSummary(data, { indent: '  ', enableColors: true }),
    [`results/stress-${timestamp}.json`]: JSON.stringify(data, null, 2),
  };
}

// Import text summary helper
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
