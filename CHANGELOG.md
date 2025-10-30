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
