# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-30

### Added

#### Core Features
- Initial release of k6 load testing suite for MS Teams Bot (workoflow-bot)
- Multi-environment support (LOCAL, STAGE, PROD)
- Bot Framework authentication using `botframework-connector` library
- Proper Bot Framework Activity format following v4 schema

#### Test Scripts
- `simple-message.test.js` - Basic load test sending "test" messages
- `smoke.test.js` - Quick connectivity and health check test

#### Libraries
- `auth-helper.js` - JWT token generation using Microsoft Bot Framework credentials
- `activity-factory.js` - Bot Framework Activity object creation
- `constants.js` - Shared constants for Activity types, roles, and defaults

#### Helper Scripts
- `generate-token.js` - CLI tool for generating Bot Framework JWT tokens
- `verify-setup.js` - Environment setup verification script

#### Configuration
- Environment-specific config files (local, stage, prod)
- `.env.example` template for credentials
- npm scripts for running tests across environments

#### Documentation
- Comprehensive README.md with:
  - Quick start guide
  - How it works explanation
  - Troubleshooting section
  - Customization examples
  - Security best practices
- CHANGELOG.md for version tracking

#### Project Structure
- Organized directory structure with clear separation of concerns
- `.gitignore` to protect sensitive credentials
- `package.json` with all required dependencies

### Configuration

#### Default Load Test Profile
- Ramp up: 10s to 5 VUs
- Sustained: 30s at 5 VUs
- Ramp down: 10s to 0 VUs

#### Default Thresholds
- Error rate: < 1%
- 95th percentile response time: < 500ms
- 99th percentile response time: < 1000ms

### Dependencies
- `botframework-connector` ^4.23.3 - Microsoft Bot Framework authentication
- `dotenv` ^16.4.5 - Environment variable management
- `uuid` ^10.0.0 - Unique identifier generation

### Technical Details
- Node.js >= 18.0.0 required
- Uses ES modules (import/export)
- Token caching to avoid regeneration
- Proper JWT handling with expiration tracking

### Security
- Credentials stored in gitignored `.env` file
- Separate credentials per environment
- JWT tokens with 1-hour expiration
- No hardcoded secrets in codebase

---

## [2.0.0] - 2025-10-31

### Breaking Changes
- **SIMPLIFIED CONFIGURATION**: Removed multi-environment complexity in favor of single `BOT_ENDPOINT` variable
- Removed environment-specific config files (config/local.env.js, config/stage.env.js, config/prod.env.js)
- Removed authentication complexity - now uses `LOAD_TEST_MODE=true` for simplified testing
- Changed npm scripts from 14 environment-specific scripts to 3 simple scripts

### Removed
- **Deleted config/ directory** - Unused environment-specific configuration files
- **Deleted lib/ directory** - Unused authentication and activity factory helpers (not needed with LOAD_TEST_MODE)
  - `lib/auth-helper.js` - JWT token generation (not needed)
  - `lib/activity-factory.js` - Activity creation helper (tests create inline)
  - `lib/constants.js` - Bot Framework constants (not imported)
- **Deleted scripts/generate-token.js** - Token generation not needed with LOAD_TEST_MODE
- **Deleted scripts/test-with-token.sh** - Authentication bypass script not needed
- Removed environment-specific variables (LOCAL_*, STAGE_*, PROD_* prefixes)
- Removed authentication checks from smoke tests
- Removed botframework-connector dependency (authentication not needed)

### Changed
- **Simplified .env configuration** to single `BOT_ENDPOINT` variable
- **Simplified npm scripts**:
  - Before: 14 scripts (test:local, test:stage, test:prod, smoke:local, etc.)
  - After: 3 scripts (test, smoke, verify)
- **Simplified test files**:
  - Removed ENV parameter and switch/case logic
  - Tests now read BOT_ENDPOINT directly with sensible defaults
  - Removed authentication complexity from smoke.test.js
- **Updated README.md** - Complete rewrite for simplified single-endpoint approach
- **Simplified .env.example** template to match new structure

### Improved
- **Much simpler workflow**: Set BOT_ENDPOINT → Run test → Done
- **No authentication complexity** - LOAD_TEST_MODE bypasses Bot Framework auth
- **Clearer mental model** - One configuration approach instead of multiple environments
- **Reduced dependencies** - Removed botframework-connector (no longer needed)
- **Better documentation** - Focused on the simplified approach

### Migration Guide
If upgrading from 1.0.0:

1. **Update .env file**:
   ```bash
   # Old (1.0.0)
   LOCAL_BOT_ENDPOINT=http://localhost:3978/api/messages
   STAGE_BOT_ENDPOINT=https://stage.example.com/api/messages
   # ... etc

   # New (2.0.0)
   BOT_ENDPOINT=http://localhost:3978/api/messages
   ```

2. **Update npm scripts**:
   ```bash
   # Old (1.0.0)
   npm run test:local
   npm run smoke:stage

   # New (2.0.0)
   npm test
   npm run smoke
   # Use BOT_ENDPOINT env var to test different endpoints
   BOT_ENDPOINT=https://stage.example.com/api/messages npm test
   ```

3. **Start bot with LOAD_TEST_MODE**:
   ```bash
   cd ../workoflow-bot
   LOAD_TEST_MODE=true npm start
   ```

### Technical Details
- Requires workoflow-bot with LOAD_TEST_MODE=true support
- No authentication tokens needed
- Single unified configuration approach
- Compatible with any bot endpoint (local or remote)

---

## [Unreleased]

### Planned Features
- Parallel message scenarios
- Adaptive Card load testing
- Thread reply testing
- File upload testing
- Teams channel conversation testing
- Real-time metrics dashboard integration
- CI/CD pipeline integration
- Docker containerization
- Result visualization and reporting

---

**Note:** This project follows semantic versioning. Version numbers indicate:
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backwards compatible manner
- **PATCH** version for backwards compatible bug fixes

For upgrade instructions between versions, see the README.md file.
