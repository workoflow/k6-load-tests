#!/usr/bin/env node

/**
 * Token Generator Script
 *
 * Generates a valid JWT token for Bot Framework authentication
 * using the botframework-connector library.
 *
 * Usage:
 *   node scripts/generate-token.js [environment]
 *   npm run generate-token -- local
 *   npm run generate-token -- stage
 *   npm run generate-token -- prod
 *
 * The generated token can be used with k6 tests via:
 *   export BOT_TOKEN="<generated-token>"
 *   k6 run --env ENV=local tests/simple-message.test.js
 */

import dotenv from 'dotenv';
import { getAuthorizationHeader, getTokenInfo } from '../lib/auth-helper.js';

// Load environment variables
dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args[0] || 'local';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Get credentials for the specified environment
 */
function getCredentials(env) {
  const envUpper = env.toUpperCase();

  const appId = process.env[`${envUpper}_MICROSOFT_APP_ID`];
  const appPassword = process.env[`${envUpper}_MICROSOFT_APP_PASSWORD`];
  const tenantId = process.env[`${envUpper}_MICROSOFT_APP_TENANT_ID`];
  const endpoint = process.env[`${envUpper}_BOT_ENDPOINT`];

  if (!appId || !appPassword) {
    throw new Error(
      `Missing credentials for ${env} environment. ` +
      `Please set ${envUpper}_MICROSOFT_APP_ID and ${envUpper}_MICROSOFT_APP_PASSWORD in .env file.`
    );
  }

  return { appId, appPassword, tenantId, endpoint };
}

/**
 * Main function
 */
async function main() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         Bot Framework Token Generator                     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  try {
    // Get credentials
    console.log(`${colors.blue}Environment:${colors.reset} ${environment.toUpperCase()}`);
    const credentials = getCredentials(environment);

    console.log(`${colors.blue}App ID:${colors.reset} ${credentials.appId}`);
    console.log(`${colors.blue}Endpoint:${colors.reset} ${credentials.endpoint || 'Not configured'}`);
    console.log('');

    // Generate token
    console.log(`${colors.yellow}Generating token...${colors.reset}`);
    const authHeader = await getAuthorizationHeader(
      credentials.appId,
      credentials.appPassword
    );

    // Get token info
    const tokenInfo = await getTokenInfo(
      credentials.appId,
      credentials.appPassword
    );

    // Display results
    console.log(`${colors.green}✓ Token generated successfully!${colors.reset}\n`);

    console.log(`${colors.bright}Token Information:${colors.reset}`);
    console.log(`  Expires at: ${tokenInfo.expiresAt}`);
    console.log(`  Issuer: ${tokenInfo.issuer}`);
    console.log(`  Audience: ${tokenInfo.audience}`);
    console.log(`  App ID: ${tokenInfo.appId}`);
    console.log('');

    console.log(`${colors.bright}Full Token:${colors.reset}`);
    console.log(tokenInfo.token);
    console.log('');

    console.log(`${colors.bright}Usage with k6:${colors.reset}`);
    console.log('');
    console.log(`  ${colors.cyan}# Set token as environment variable:${colors.reset}`);
    console.log(`  export BOT_TOKEN="${tokenInfo.token}"`);
    console.log('');
    console.log(`  ${colors.cyan}# Run k6 test:${colors.reset}`);
    console.log(`  k6 run --env ENV=${environment} tests/simple-message.test.js`);
    console.log('');
    console.log(`  ${colors.cyan}# Or in one line:${colors.reset}`);
    console.log(`  BOT_TOKEN="${tokenInfo.token}" k6 run --env ENV=${environment} tests/simple-message.test.js`);
    console.log('');

    console.log(`${colors.yellow}Note:${colors.reset} Token is valid for approximately 1 hour.`);
    console.log('');

  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    console.error('');
    console.error(`${colors.yellow}Troubleshooting:${colors.reset}`);
    console.error('  1. Ensure .env file exists and contains valid credentials');
    console.error('  2. Check that credentials have the correct format');
    console.error('  3. Verify internet connectivity (token validation requires online access)');
    console.error('  4. Run: npm run verify');
    console.error('');
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
