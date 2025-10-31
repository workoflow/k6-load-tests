/**
 * k6 Smoke Test: Basic Connectivity
 *
 * This test performs a quick validation that the bot endpoint is accessible
 * and can process a single message. Use this before running full load tests.
 *
 * Usage:
 *   k6 run tests/smoke.test.js
 *   k6 run --env BOT_ENDPOINT=http://remote-bot:3978/api/messages tests/smoke.test.js
 *
 * Prerequisites:
 *   - Start bot with: LOAD_TEST_MODE=true npm start
 *   - Set BOT_ENDPOINT in .env (default: http://localhost:3978/api/messages)
 */

import http from 'k6/http';
import { check, group } from 'k6';

// Load bot endpoint from environment
const BOT_ENDPOINT = __ENV.BOT_ENDPOINT || 'http://localhost:3978/api/messages';
const HEALTH_ENDPOINT = BOT_ENDPOINT.replace('/api/messages', '/api/health');

console.log(`Bot endpoint: ${BOT_ENDPOINT}`);
console.log(`Health endpoint: ${HEALTH_ENDPOINT}`);

// Test configuration - single VU, one iteration
export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ['rate<0.1'],     // Allow 10% failure for smoke test
    http_req_duration: ['p(95)<2000'],  // More lenient for smoke test
  },
  tags: {
    test_type: 'smoke',
  },
};

/**
 * Helper function to create a Bot Framework Activity
 */
function createActivity(text = 'smoke test') {
  const activityId = `smoke-test-${Date.now()}`;
  const conversationId = `smoke-conversation-${Date.now()}`;

  return {
    type: 'message',
    id: activityId,
    timestamp: new Date().toISOString(),
    channelId: 'msteams',

    from: {
      id: __ENV.TEST_USER_ID || '29:smoke-test-user',
      name: __ENV.TEST_USER_NAME || 'Smoke Test User',
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
    },

    text: text,
    textFormat: 'plain',
    locale: 'en-US',

    serviceUrl: __ENV.SERVICE_URL || 'https://smba.trafficmanager.net/teams',
  };
}

/**
 * Main smoke test function
 */
export default function () {
  console.log(`\n🔍 Running smoke test`);
  console.log(`📍 Endpoint: ${BOT_ENDPOINT}`);
  console.log('─'.repeat(60));

  // Test 1: Health Check
  group('Health Check', () => {
    console.log('Testing health endpoint...');
    const healthResponse = http.get(HEALTH_ENDPOINT);

    const healthOk = check(healthResponse, {
      'health endpoint is accessible': (r) => r.status === 200,
    });

    if (healthOk) {
      console.log('✓ Health check passed');
    } else {
      console.warn(`⚠ Health check returned: ${healthResponse.status}`);
    }
  });

  // Test 2: Bot Endpoint Connectivity
  group('Bot Endpoint Connectivity', () => {
    console.log('Testing bot message endpoint...');

    const activity = createActivity('smoke test');
    const payload = JSON.stringify(activity);

    const headers = {
      'Content-Type': 'application/json',
    };

    const params = {
      headers: headers,
    };

    const response = http.post(BOT_ENDPOINT, payload, params);

    // LOAD_TEST_MODE: Expect success (200 or 202)
    const checks = check(response, {
      'endpoint is reachable': (r) => r.status !== 0,
      'status is 200 or 202': (r) => r.status === 200 || r.status === 202,
      'response time < 5s': (r) => r.timings.duration < 5000,
    });

    console.log(`Response status: ${response.status}`);
    console.log(`Response time: ${response.timings.duration.toFixed(2)}ms`);

    if (response.status === 200 || response.status === 202) {
      console.log('✓ Message sent successfully');
    } else if (response.status === 404) {
      console.error('❌ Not Found - Check the endpoint URL');
    } else if (response.status >= 500) {
      console.error('❌ Server error - Check bot application logs');
      console.error(`Response body: ${response.body}`);
    } else {
      console.warn(`⚠ Unexpected status: ${response.status}`);
      console.warn(`Response body: ${response.body}`);
    }

    if (!checks) {
      console.error('❌ Some checks failed - review the output above');
    }
  });

  console.log('─'.repeat(60));
  console.log('\n✓ Running in LOAD_TEST_MODE (no authentication required)');
  console.log('\n💡 If smoke test passes, you can run full load tests:');
  console.log('   npm test\n');
}
