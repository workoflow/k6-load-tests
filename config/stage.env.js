/**
 * Stage Environment Configuration for k6 Load Tests
 *
 * This configuration targets the staging environment of the bot
 */

export const config = {
  name: 'STAGE',
  endpoint: __ENV.STAGE_BOT_ENDPOINT,

  // Microsoft Bot Framework Credentials
  credentials: {
    appId: __ENV.STAGE_MICROSOFT_APP_ID,
    appPassword: __ENV.STAGE_MICROSOFT_APP_PASSWORD,
    tenantId: __ENV.STAGE_MICROSOFT_APP_TENANT_ID,
  },

  // Bot Framework Service URL
  serviceUrl: __ENV.SERVICE_URL || 'https://smba.trafficmanager.net/teams',

  // Test User Configuration
  testUser: {
    id: __ENV.TEST_USER_ID || '29:load-test-user-stage',
    name: __ENV.TEST_USER_NAME || 'Load Test User (Stage)',
    aadObjectId: __ENV.TEST_USER_AAD_OBJECT_ID || '45908692-019e-4436-810c-b417f58f5f4f',
  },

  // Load Test Parameters
  loadTest: {
    vus: parseInt(__ENV.DEFAULT_VUS) || 5,
    duration: __ENV.DEFAULT_DURATION || '30s',
    message: __ENV.TEST_MESSAGE || 'test',
  },

  // Thresholds (slightly more lenient for remote environment)
  thresholds: {
    http_req_failed: ['rate<0.01'],        // Less than 1% errors
    http_req_duration: ['p(95)<1000'],      // 95% of requests < 1s
    http_req_duration: ['p(99)<2000'],      // 99% of requests < 2s
  },
};

export default config;
