/**
 * k6 Smoke Test: Basic Connectivity
 *
 * This test performs a quick validation that the bot endpoint is accessible
 * and can process a single message. Use this before running full load tests.
 *
 * Usage:
 *   k6 run --env ENV=local tests/smoke.test.js
 *   k6 run --env ENV=stage tests/smoke.test.js
 *   k6 run --env ENV=prod tests/smoke.test.js
 *
 * Prerequisites:
 *   - Run `npm run generate-token` to get a valid JWT token
 *   - Set BOT_TOKEN environment variable
 */

import http from 'k6/http';
import { check, group } from 'k6';

// Load environment configuration
const ENV = __ENV.ENV || 'local';
let config;

switch (ENV.toLowerCase()) {
  case 'local':
    config = {
      endpoint: __ENV.LOCAL_BOT_ENDPOINT || 'http://localhost:3978/api/messages',
      healthEndpoint: __ENV.LOCAL_BOT_ENDPOINT ?
        __ENV.LOCAL_BOT_ENDPOINT.replace('/api/messages', '/api/health') :
        'http://localhost:3978/api/health',
      appId: __ENV.LOCAL_MICROSOFT_APP_ID,
      tenantId: __ENV.LOCAL_MICROSOFT_APP_TENANT_ID,
      token: __ENV.BOT_TOKEN,
    };
    break;
  case 'stage':
    config = {
      endpoint: __ENV.STAGE_BOT_ENDPOINT,
      healthEndpoint: __ENV.STAGE_BOT_ENDPOINT?.replace('/api/messages', '/api/health'),
      appId: __ENV.STAGE_MICROSOFT_APP_ID,
      tenantId: __ENV.STAGE_MICROSOFT_APP_TENANT_ID,
      token: __ENV.BOT_TOKEN,
    };
    break;
  case 'prod':
    config = {
      endpoint: __ENV.PROD_BOT_ENDPOINT,
      healthEndpoint: __ENV.PROD_BOT_ENDPOINT?.replace('/api/messages', '/api/health'),
      appId: __ENV.PROD_MICROSOFT_APP_ID,
      tenantId: __ENV.PROD_MICROSOFT_APP_TENANT_ID,
      token: __ENV.BOT_TOKEN,
    };
    break;
  default:
    throw new Error(`Unknown environment: ${ENV}`);
}

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
    environment: ENV,
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
 * Main smoke test function
 */
export default function () {
  console.log(`\n🔍 Running smoke test for ${ENV.toUpperCase()} environment`);
  console.log(`📍 Endpoint: ${config.endpoint}`);
  console.log('─'.repeat(60));

  // Test 1: Health Check (if available)
  if (config.healthEndpoint) {
    group('Health Check', () => {
      console.log('Testing health endpoint...');
      const healthResponse = http.get(config.healthEndpoint);

      const healthOk = check(healthResponse, {
        'health endpoint is accessible': (r) => r.status === 200,
      });

      if (healthOk) {
        console.log('✓ Health check passed');
      } else {
        console.warn(`⚠ Health check returned: ${healthResponse.status}`);
      }
    });
  }

  // Test 2: Bot Endpoint Connectivity
  group('Bot Endpoint Connectivity', () => {
    console.log('Testing bot message endpoint...');

    const activity = createActivity('smoke test');
    const payload = JSON.stringify(activity);
    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': config.token ? `Bearer ${config.token}` : '',
      },
    };

    const response = http.post(config.endpoint, payload, params);

    const checks = check(response, {
      'endpoint is reachable': (r) => r.status !== 0,
      'status is 200 or 202': (r) => r.status === 200 || r.status === 202,
      'status is not 401 (auth OK)': (r) => r.status !== 401,
      'status is not 403 (forbidden)': (r) => r.status !== 403,
      'status is not 500 (server error)': (r) => r.status !== 500,
      'response time < 5s': (r) => r.timings.duration < 5000,
    });

    console.log(`Response status: ${response.status}`);
    console.log(`Response time: ${response.timings.duration.toFixed(2)}ms`);

    if (response.status === 401) {
      console.error('❌ Authentication failed - Check your BOT_TOKEN');
    } else if (response.status === 403) {
      console.error('❌ Forbidden - Check bot permissions and credentials');
    } else if (response.status === 404) {
      console.error('❌ Not Found - Check the endpoint URL');
    } else if (response.status >= 500) {
      console.error('❌ Server error - Check bot application logs');
      console.error(`Response body: ${response.body}`);
    } else if (response.status === 200 || response.status === 202) {
      console.log('✓ Message sent successfully');
    } else {
      console.warn(`⚠ Unexpected status: ${response.status}`);
      console.warn(`Response body: ${response.body}`);
    }

    if (!checks) {
      console.error('❌ Some checks failed - review the output above');
    }
  });

  console.log('─'.repeat(60));

  // Summary
  if (!config.token) {
    console.warn('\n⚠️  No BOT_TOKEN provided. Run `npm run generate-token` first.');
  }

  console.log('\n💡 If smoke test passes, you can run full load tests:');
  console.log(`   npm run test:${ENV}\n`);
}
