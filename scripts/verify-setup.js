#!/usr/bin/env node

/**
 * Setup Verification Script
 *
 * Verifies that the environment is correctly configured for running
 * k6 load tests against the Bot Framework endpoint.
 *
 * Usage:
 *   node scripts/verify-setup.js
 *   npm run verify
 */

import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Load environment variables
dotenv.config({ path: resolve(projectRoot, '.env') });

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const CHECK_MARK = '✓';
const CROSS_MARK = '✗';
const WARNING_MARK = '⚠';

let hasErrors = false;
let hasWarnings = false;

/**
 * Print section header
 */
function printHeader(title) {
  console.log('');
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log('─'.repeat(60));
}

/**
 * Print check result
 */
function printCheck(label, passed, message = '') {
  const symbol = passed ? CHECK_MARK : CROSS_MARK;
  const color = passed ? colors.green : colors.red;
  const status = passed ? 'OK' : 'FAIL';

  console.log(`  ${color}${symbol}${colors.reset} ${label}: ${color}${status}${colors.reset}`);

  if (message) {
    console.log(`    ${colors.dim}${message}${colors.reset}`);
  }

  if (!passed) {
    hasErrors = true;
  }
}

/**
 * Print warning
 */
function printWarning(label, message = '') {
  console.log(`  ${colors.yellow}${WARNING_MARK}${colors.reset} ${label}: ${colors.yellow}WARNING${colors.reset}`);

  if (message) {
    console.log(`    ${colors.dim}${message}${colors.reset}`);
  }

  hasWarnings = true;
}

/**
 * Check if file exists
 */
function checkFile(filePath, label) {
  const fullPath = resolve(projectRoot, filePath);
  const exists = existsSync(fullPath);
  printCheck(label, exists, exists ? fullPath : 'File not found');
  return exists;
}

/**
 * Check environment variable
 */
function checkEnvVar(varName, required = true) {
  const value = process.env[varName];
  const exists = !!value;

  if (required) {
    printCheck(varName, exists, exists ? 'Set' : 'Missing');
  } else {
    if (!exists) {
      printWarning(varName, 'Optional but recommended');
    } else {
      printCheck(varName, true, 'Set');
    }
  }

  return exists;
}

/**
 * Check credentials for an environment
 */
function checkEnvironmentCredentials(env) {
  const envUpper = env.toUpperCase();
  printHeader(`${env.toUpperCase()} Environment`);

  const appId = checkEnvVar(`${envUpper}_MICROSOFT_APP_ID`);
  const appPassword = checkEnvVar(`${envUpper}_MICROSOFT_APP_PASSWORD`);
  const tenantId = checkEnvVar(`${envUpper}_MICROSOFT_APP_TENANT_ID`);
  const endpoint = checkEnvVar(`${envUpper}_BOT_ENDPOINT`);

  return appId && appPassword && tenantId && endpoint;
}

/**
 * Main verification function
 */
async function main() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         k6 Load Test Setup Verification                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  // Check required files
  printHeader('Required Files');
  checkFile('package.json', 'package.json');
  checkFile('.env', '.env file');
  checkFile('lib/auth-helper.js', 'Authentication helper');
  checkFile('lib/activity-factory.js', 'Activity factory');
  checkFile('lib/constants.js', 'Constants');
  checkFile('tests/simple-message.test.js', 'Simple message test');
  checkFile('tests/smoke.test.js', 'Smoke test');
  checkFile('config/local.env.js', 'Local config');
  checkFile('config/stage.env.js', 'Stage config');
  checkFile('config/prod.env.js', 'Prod config');

  // Check Node.js dependencies
  printHeader('Node.js Dependencies');
  const nodeModules = existsSync(resolve(projectRoot, 'node_modules'));
  printCheck('node_modules', nodeModules,
    nodeModules ? 'Dependencies installed' : 'Run: npm install');

  // Check k6 installation
  printHeader('k6 Installation');
  try {
    const { execSync } = await import('child_process');
    const k6Version = execSync('k6 version', { encoding: 'utf-8' }).trim();
    printCheck('k6', true, k6Version);
  } catch (error) {
    printCheck('k6', false, 'k6 not found. Install from: https://k6.io/docs/get-started/installation/');
  }

  // Check environment configurations
  const localOk = checkEnvironmentCredentials('local');
  const stageOk = checkEnvironmentCredentials('stage');
  const prodOk = checkEnvironmentCredentials('prod');

  // Check optional environment variables
  printHeader('Optional Configuration');
  checkEnvVar('TEST_USER_ID', false);
  checkEnvVar('TEST_USER_NAME', false);
  checkEnvVar('TEST_USER_AAD_OBJECT_ID', false);
  checkEnvVar('SERVICE_URL', false);

  // Summary
  printHeader('Summary');

  if (hasErrors) {
    console.log(`  ${colors.red}${CROSS_MARK} Setup has errors that need to be fixed${colors.reset}`);
    console.log('');
    console.log(`${colors.yellow}Next steps:${colors.reset}`);
    console.log('  1. Create .env file from .env.example: cp .env.example .env');
    console.log('  2. Fill in the required credentials in .env');
    console.log('  3. Run: npm install');
    console.log('  4. Install k6: https://k6.io/docs/get-started/installation/');
    console.log('  5. Run this script again: npm run verify');
    console.log('');
    process.exit(1);
  } else if (hasWarnings) {
    console.log(`  ${colors.yellow}${WARNING_MARK} Setup is functional but has warnings${colors.reset}`);
    console.log('');
    console.log(`${colors.green}You can proceed with running tests!${colors.reset}`);
    console.log('');
    if (localOk) {
      console.log(`  ${colors.cyan}Run smoke test:${colors.reset} npm run smoke:local`);
      console.log(`  ${colors.cyan}Run load test:${colors.reset} npm run test:local`);
    }
    console.log('');
  } else {
    console.log(`  ${colors.green}${CHECK_MARK} Setup is complete and ready!${colors.reset}`);
    console.log('');
    console.log(`${colors.bright}Next steps:${colors.reset}`);
    console.log('');
    console.log(`  ${colors.cyan}1. Generate token:${colors.reset}`);
    console.log('     npm run generate-token -- local');
    console.log('');
    console.log(`  ${colors.cyan}2. Run smoke test:${colors.reset}`);
    console.log('     export BOT_TOKEN="<token-from-step-1>"');
    console.log('     npm run smoke:local');
    console.log('');
    console.log(`  ${colors.cyan}3. Run load test:${colors.reset}`);
    console.log('     npm run test:local');
    console.log('');
  }
}

// Run the script
main().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
