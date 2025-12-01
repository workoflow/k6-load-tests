/**
 * k6 Load Test: Simple Message
 *
 * This test sends a simple "test" message to the bot endpoint.
 * No authentication required - bot must be started with LOAD_TEST_MODE=true.
 *
 * Usage:
 *   k6 run tests/simple-message.test.js
 *   k6 run --env BOT_ENDPOINT=http://remote-bot:3978/api/messages tests/simple-message.test.js
 *
 * Prerequisites:
 *   - Start bot with: LOAD_TEST_MODE=true npm start
 *   - Set BOT_ENDPOINT in .env (default: http://localhost:3978/api/messages)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Load bot endpoint from environment
const BOT_ENDPOINT = __ENV.BOT_ENDPOINT || 'http://localhost:3978/api/messages';

console.log(`Bot endpoint: ${BOT_ENDPOINT}`);

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '10s', target: 5 },   // Ramp up to 5 VUs
    { duration: '30s', target: 5 },   // Stay at 5 VUs
    { duration: '10s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true }],  // Less than 1% errors
    http_req_duration: ['p(95)<10000'],    // 95% of requests < 10s (adjusted for n8n workflow)
    http_req_duration: ['p(99)<15000'],    // 99% of requests < 15s
    errors: ['rate<0.05'],                 // Custom error rate < 5%
  },
  tags: {
    test_type: 'load',
  },
};

/**
 * Helper function to create a Bot Framework Activity
 */
function createActivity(text = 'test') {
  const activityId = `load-test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const conversationId = `test-conversation-${Date.now()}`;

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
 * Main test function - executed by each virtual user
 */
export default function () {
  // Create activity
  const activity = createActivity(__ENV.TEST_MESSAGE || 'test');

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
    },
  };

  // Send request
  const response = http.post(BOT_ENDPOINT, payload, params);

  // Check response - expect success
  const success = check(response, {
    'status is 200 or 202': (r) => r.status === 200 || r.status === 202,
    'response time < 10s': (r) => r.timings.duration < 10000,
  });

  // Track errors
  errorRate.add(!success);

  // Log errors for debugging
  if (!success) {
    console.error(`Request failed: ${response.status} - ${response.body}`);
  }

  // Think time between requests
  sleep(1);
}

/**
 * Setup function - runs once before the test starts
 */
export function setup() {
  console.log(`\n🚀 Starting load test`);
  console.log(`📍 Endpoint: ${BOT_ENDPOINT}`);
  console.log(`⚠️  Bot must be started with LOAD_TEST_MODE=true`);
  console.log('─'.repeat(60));

  return { startTime: new Date() };
}

/**
 * Teardown function - runs once after the test completes
 */
export function teardown(data) {
  const duration = (new Date() - data.startTime) / 1000;
  console.log('─'.repeat(60));
  console.log(`✅ Test completed in ${duration.toFixed(2)}s`);
}
