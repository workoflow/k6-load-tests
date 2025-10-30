/**
 * Local Environment Configuration for k6 Load Tests
 *
 * This configuration targets the local development instance of the bot
 * running at http://localhost:3978
 */

export const config = {
  name: 'LOCAL',
  endpoint: __ENV.LOCAL_BOT_ENDPOINT || 'http://localhost:3978/api/messages',

  // Microsoft Bot Framework Credentials
  credentials: {
    appId: __ENV.LOCAL_MICROSOFT_APP_ID,
    appPassword: __ENV.LOCAL_MICROSOFT_APP_PASSWORD,
    tenantId: __ENV.LOCAL_MICROSOFT_APP_TENANT_ID,
  },

  // Bot Framework Service URL
  serviceUrl: __ENV.SERVICE_URL || 'https://smba.trafficmanager.net/teams',

  // Test User Configuration
  testUser: {
    id: __ENV.TEST_USER_ID || '29:load-test-user-local',
    name: __ENV.TEST_USER_NAME || 'Load Test User (Local)',
    aadObjectId: __ENV.TEST_USER_AAD_OBJECT_ID || '45908692-019e-4436-810c-b417f58f5f4f',
  },

  // Load Test Parameters
  loadTest: {
    vus: parseInt(__ENV.DEFAULT_VUS) || 5,
    duration: __ENV.DEFAULT_DURATION || '30s',
    message: __ENV.TEST_MESSAGE || 'test',
  },

  // Thresholds
  thresholds: {
    http_req_failed: ['rate<0.01'],        // Less than 1% errors
    http_req_duration: ['p(95)<500'],       // 95% of requests < 500ms
    http_req_duration: ['p(99)<1000'],      // 99% of requests < 1s
  },
};

export default config;
