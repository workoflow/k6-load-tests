/**
 * k6 Load Test: Simple Message
 *
 * This test sends a simple "test" message to the bot endpoint
 * with proper Bot Framework authentication.
 *
 * Usage:
 *   k6 run --env ENV=local tests/simple-message.test.js
 *   k6 run --env ENV=stage tests/simple-message.test.js
 *   k6 run --env ENV=prod tests/simple-message.test.js
 *
 * Prerequisites:
 *   - Run `npm run generate-token` to get a valid JWT token
 *   - Set BOT_TOKEN environment variable or use token from .env
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Load environment configuration
const ENV = __ENV.ENV || 'local';
let config;

switch (ENV.toLowerCase()) {
  case 'local':
    config = {
      endpoint: __ENV.LOCAL_BOT_ENDPOINT || 'http://localhost:3978/api/messages',
      appId: __ENV.LOCAL_MICROSOFT_APP_ID,
      tenantId: __ENV.LOCAL_MICROSOFT_APP_TENANT_ID,
      token: __ENV.BOT_TOKEN,
    };
    break;
  case 'stage':
    config = {
      endpoint: __ENV.STAGE_BOT_ENDPOINT,
      appId: __ENV.STAGE_MICROSOFT_APP_ID,
      tenantId: __ENV.STAGE_MICROSOFT_APP_TENANT_ID,
      token: __ENV.BOT_TOKEN,
    };
    break;
  case 'prod':
    config = {
      endpoint: __ENV.PROD_BOT_ENDPOINT,
      appId: __ENV.PROD_MICROSOFT_APP_ID,
      tenantId: __ENV.PROD_MICROSOFT_APP_TENANT_ID,
      token: __ENV.BOT_TOKEN,
    };
    break;
  default:
    throw new Error(`Unknown environment: ${ENV}`);
}

// Validate configuration
if (!config.endpoint) {
  throw new Error(`Missing bot endpoint for environment: ${ENV}`);
}
if (!config.token) {
  console.warn('⚠️  No BOT_TOKEN provided. Run `npm run generate-token` to generate one.');
}

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
    http_req_failed: ['rate<0.01'],      // Less than 1% errors
    http_req_duration: ['p(95)<500'],     // 95% of requests < 500ms
    http_req_duration: ['p(99)<1000'],    // 99% of requests < 1s
    errors: ['rate<0.05'],                // Custom error rate < 5%
  },
  tags: {
    test_type: 'load',
    environment: ENV,
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
      id: config.appId,
      name: 'Workoflow Bot',
      role: 'bot',
    },

    conversation: {
      id: conversationId,
      conversationType: 'personal',
      isGroup: false,
      tenantId: config.tenantId,
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
  };

  // Only add Authorization header if token is provided
  // (for authenticated environments like STAGE/PROD)
  if (config.token) {
    headers['Authorization'] = `Bearer ${config.token}`;
  }

  const params = {
    headers: headers,
    tags: {
      name: 'SendMessage',
    },
  };

  // Send request
  const response = http.post(config.endpoint, payload, params);

  // Check response
  const success = check(response, {
    'status is 200 or 202': (r) => r.status === 200 || r.status === 202,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
    'no error in response': (r) => !r.body || !r.body.includes('error'),
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
  console.log(`\n🚀 Starting load test for ${ENV.toUpperCase()} environment`);
  console.log(`📍 Endpoint: ${config.endpoint}`);
  console.log(`👤 App ID: ${config.appId || 'Not configured (unauthenticated mode)'}`);
  console.log(`🔑 Token: ${config.token ? 'Provided ✓' : 'Not required (unauthenticated mode) ✓'}`);
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
