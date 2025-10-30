/**
 * Production Environment Configuration for k6 Load Tests
 *
 * ⚠️  WARNING: This configuration targets the PRODUCTION environment
 * Use with extreme caution and only with proper authorization
 */

export const config = {
  name: 'PRODUCTION',
  endpoint: __ENV.PROD_BOT_ENDPOINT,

  // Microsoft Bot Framework Credentials
  credentials: {
    appId: __ENV.PROD_MICROSOFT_APP_ID,
    appPassword: __ENV.PROD_MICROSOFT_APP_PASSWORD,
    tenantId: __ENV.PROD_MICROSOFT_APP_TENANT_ID,
  },

  // Bot Framework Service URL
  serviceUrl: __ENV.SERVICE_URL || 'https://smba.trafficmanager.net/teams',

  // Test User Configuration
  testUser: {
    id: __ENV.TEST_USER_ID || '29:load-test-user-prod',
    name: __ENV.TEST_USER_NAME || 'Load Test User (Prod)',
    aadObjectId: __ENV.TEST_USER_AAD_OBJECT_ID || '45908692-019e-4436-810c-b417f58f5f4f',
  },

  // Load Test Parameters (Conservative for production)
  loadTest: {
    vus: parseInt(__ENV.DEFAULT_VUS) || 5,
    duration: __ENV.DEFAULT_DURATION || '30s',
    message: __ENV.TEST_MESSAGE || 'test',
  },

  // Thresholds (more lenient for production to avoid false alarms)
  thresholds: {
    http_req_failed: ['rate<0.02'],        // Less than 2% errors
    http_req_duration: ['p(95)<1500'],      // 95% of requests < 1.5s
    http_req_duration: ['p(99)<3000'],      // 99% of requests < 3s
  },
};

export default config;
