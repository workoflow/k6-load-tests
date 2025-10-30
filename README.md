# k6 Load Tests for MS Teams Bot

Comprehensive load testing suite for the **workoflow-bot** Microsoft Teams Bot using [k6](https://k6.io/), Grafana's open-source load testing tool. This project uses Microsoft's official Bot Framework libraries for proper authentication and message formatting.

## 🎯 Overview

This project provides a production-ready load testing environment for testing MS Teams bots that use the Microsoft Bot Framework. It includes:

- ✅ **Proper Bot Framework Authentication** using `botframework-connector`
- ✅ **Valid Activity Format** following Bot Framework v4 schema
- ✅ **Multi-Environment Support** (LOCAL, STAGE, PROD)
- ✅ **Best Practice Test Scenarios** (smoke tests, load tests)
- ✅ **Helper Scripts** for token generation and setup verification
- ✅ **Comprehensive Documentation**

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Node.js** >= 18.0.0
2. **k6** installed ([Installation Guide](https://k6.io/docs/get-started/installation/))
3. **Microsoft Bot Framework Credentials**:
   - App ID (MicrosoftAppId)
   - App Password (MicrosoftAppPassword)
   - Tenant ID (MicrosoftAppTenantId)
4. **Access to bot endpoints** (local, stage, or production)

### Installing k6

```bash
# macOS (Homebrew)
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows (Chocolatey)
choco install k6

# Or download binary from: https://k6.io/docs/get-started/installation/
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your Bot Framework credentials:

```env
# LOCAL Environment
LOCAL_MICROSOFT_APP_ID=your-local-app-id
LOCAL_MICROSOFT_APP_PASSWORD=your-local-app-password
LOCAL_MICROSOFT_APP_TENANT_ID=your-local-tenant-id
LOCAL_BOT_ENDPOINT=http://localhost:3978/api/messages

# STAGE Environment
STAGE_MICROSOFT_APP_ID=your-stage-app-id
STAGE_MICROSOFT_APP_PASSWORD=your-stage-app-password
STAGE_MICROSOFT_APP_TENANT_ID=your-stage-tenant-id
STAGE_BOT_ENDPOINT=https://stage.example.com/api/messages

# PROD Environment
PROD_MICROSOFT_APP_ID=your-prod-app-id
PROD_MICROSOFT_APP_PASSWORD=your-prod-app-password
PROD_MICROSOFT_APP_TENANT_ID=your-prod-tenant-id
PROD_BOT_ENDPOINT=https://prod.example.com/api/messages
```

### 3. Verify Setup

Run the verification script to ensure everything is configured correctly:

```bash
npm run verify
```

### 4. Generate JWT Token (If Required)

**For LOCAL development without Bot Framework credentials** (emulator mode):
- Skip this step! Leave `LOCAL_MICROSOFT_APP_ID`, `LOCAL_MICROSOFT_APP_PASSWORD`, and `LOCAL_MICROSOFT_APP_TENANT_ID` empty in `.env`
- The tests will run without authentication (perfect for local development)

**For STAGE/PROD or LOCAL with credentials**, generate a valid Bot Framework JWT token:

```bash
# For stage environment
npm run generate-token -- stage

# For prod environment
npm run generate-token -- prod

# For local with credentials
npm run generate-token -- local
```

Copy the generated token and export it as an environment variable:

```bash
export BOT_TOKEN="<your-generated-token>"
```

### 5. Run Smoke Test

Before running full load tests, verify connectivity with a smoke test:

```bash
# Local (no token needed if credentials are empty)
npm run smoke:local

# Stage (requires BOT_TOKEN)
export BOT_TOKEN="<your-stage-token>"
npm run smoke:stage

# Prod (requires BOT_TOKEN)
export BOT_TOKEN="<your-prod-token>"
npm run smoke:prod
```

### 6. Run Load Test

Once the smoke test passes, run the full load test:

```bash
# Local (no token needed if credentials are empty)
npm run test:local

# Stage (requires BOT_TOKEN)
export BOT_TOKEN="<your-stage-token>"
npm run test:stage

# Prod (requires BOT_TOKEN - use with caution!)
export BOT_TOKEN="<your-prod-token>"
npm run test:prod
```

## 📁 Project Structure

```
k6-load-tests/
├── config/                      # Environment configurations
│   ├── local.env.js            # Local environment config
│   ├── stage.env.js            # Stage environment config
│   └── prod.env.js             # Production environment config
│
├── lib/                         # Shared libraries
│   ├── auth-helper.js          # Bot Framework authentication
│   ├── activity-factory.js     # Activity creation helpers
│   └── constants.js            # Shared constants
│
├── tests/                       # k6 test scripts
│   ├── simple-message.test.js  # Basic message load test
│   └── smoke.test.js           # Connectivity smoke test
│
├── scripts/                     # Helper scripts
│   ├── generate-token.js       # JWT token generator
│   └── verify-setup.js         # Setup verification
│
├── .env.example                 # Environment template
├── .env                         # Your credentials (gitignored)
├── .gitignore                   # Git ignore rules
├── package.json                 # Node.js dependencies
├── README.md                    # This file
└── CHANGELOG.md                 # Version history
```

## 🔧 How It Works

### Authentication Flow

1. **Token Generation**: The `auth-helper.js` uses Microsoft's `botframework-connector` library to generate a signed JWT token using your App ID and Password.

2. **Token Validation**: The bot's `CloudAdapter` automatically validates incoming JWT tokens using the Bot Framework authentication system.

3. **Token Usage**: k6 includes the JWT token in the `Authorization: Bearer <token>` header of each HTTP request.

### Activity Structure

Messages sent to the bot follow the Bot Framework Activity schema:

```javascript
{
  type: "message",
  id: "<unique-uuid>",
  timestamp: "2025-10-30T10:30:00Z",
  channelId: "msteams",

  from: {
    id: "29:load-test-user",
    name: "Load Test User",
    aadObjectId: "45908692-019e-4436-810c-b417f58f5f4f",
    role: "user"
  },

  recipient: {
    id: "<bot-app-id>",
    name: "Bot",
    role: "bot"
  },

  conversation: {
    id: "test-conversation-123",
    conversationType: "personal",
    isGroup: false,
    tenantId: "<tenant-id>"
  },

  text: "test",
  textFormat: "plain",
  locale: "en-US",
  serviceUrl: "https://smba.trafficmanager.net/teams"
}
```

### Load Test Stages

The default load test profile:

```javascript
stages: [
  { duration: '10s', target: 5 },   // Ramp up to 5 VUs over 10s
  { duration: '30s', target: 5 },   // Stay at 5 VUs for 30s
  { duration: '10s', target: 0 },   // Ramp down to 0 VUs over 10s
]
```

### Performance Thresholds

Default thresholds that must be met for the test to pass:

- `http_req_failed: ['rate<0.01']` - Less than 1% error rate
- `http_req_duration: ['p(95)<500']` - 95th percentile under 500ms
- `http_req_duration: ['p(99)<1000']` - 99th percentile under 1000ms

## 📊 Understanding Results

After running a test, k6 provides detailed metrics:

```
✓ status is 200 or 202
✓ response time < 1000ms
✓ no error in response

http_req_duration..............: avg=245ms    min=120ms  med=230ms  max=450ms  p(95)=380ms
http_req_failed................: 0.00%   ✓ 0     ✗ 150
http_reqs......................: 150     5/s
iterations.....................: 150     5/s
```

**Key Metrics:**
- `http_req_duration` - Response time statistics
- `http_req_failed` - Percentage of failed requests
- `http_reqs` - Total requests and rate
- `iterations` - Number of complete test iterations

## 🔍 Troubleshooting

### Token Generation Fails

**Problem:** `Error generating Bot Framework token`

**Solutions:**
1. Verify credentials in `.env` are correct
2. Check internet connectivity (token generation requires online access)
3. Ensure App Password is still valid (they can expire)
4. Try regenerating credentials in Azure Portal

### 401 Unauthorized Error

**Problem:** Bot returns 401 status code

**Solutions:**
1. Generate a fresh token: `npm run generate-token -- local`
2. Verify the token hasn't expired (valid for ~1 hour)
3. Check that App ID matches between `.env` and bot configuration
4. Ensure bot is configured with correct credentials

### 403 Forbidden Error

**Problem:** Bot returns 403 status code

**Solutions:**
1. Verify the bot's tenant ID matches your credentials
2. Check that the App ID has proper permissions
3. Ensure the bot is published and accessible

### 404 Not Found Error

**Problem:** Bot endpoint not found

**Solutions:**
1. Verify the endpoint URL in `.env` is correct
2. For local testing, ensure the bot is running (`npm start` in workoflow-bot)
3. Check network connectivity to remote environments

### Connection Timeout

**Problem:** Requests timeout or take too long

**Solutions:**
1. Check network connectivity
2. For local testing, ensure localhost is not blocked by firewall
3. Verify the bot application is running and healthy
4. Check bot application logs for errors

## 🎨 Customizing Tests

### Creating Custom Test Scenarios

Create a new test file in `tests/`:

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '10s', target: 0 },   // Ramp down
  ],
};

export default function() {
  // Your test logic here
}
```

### Modifying Load Profiles

Edit `tests/simple-message.test.js` options:

```javascript
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Heavy load
    { duration: '5m', target: 50 },   // Sustained heavy load
    { duration: '1m', target: 0 },    // Ramp down
  ],
};
```

### Adding Custom Messages

Modify the activity creation in test scripts:

```javascript
const activity = createActivity('Hello, bot! This is a custom message.');
```

### Testing Different Conversation Types

Change the conversation type in `activity-factory.js`:

```javascript
conversation: {
  conversationType: 'group',  // or 'channel'
  isGroup: true,
  // ...
}
```

## 🔐 Security Best Practices

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use different credentials per environment** - Don't reuse production credentials
3. **Rotate credentials regularly** - Especially after testing
4. **Limit production testing** - Only test production with explicit authorization
5. **Monitor bot logs** - Watch for unusual activity during tests
6. **Use test users** - Create dedicated test user accounts if possible

## 🤝 Contributing

To add new features or tests:

1. Create a new branch
2. Add your changes
3. Test thoroughly in local environment
4. Update documentation
5. Submit a pull request

## 📝 License

MIT

## 🆘 Support

For issues or questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review k6 documentation: https://k6.io/docs/
3. Review Bot Framework docs: https://docs.microsoft.com/en-us/azure/bot-service/
4. Check the bot application logs in `workoflow-bot`

## 📚 Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Test Types](https://k6.io/docs/test-types/introduction/)
- [Bot Framework Documentation](https://docs.microsoft.com/en-us/azure/bot-service/)
- [Bot Framework Activity Schema](https://docs.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-connector-api-reference)
- [Microsoft Teams Bot Development](https://docs.microsoft.com/en-us/microsoftteams/platform/bots/what-are-bots)

---

**Built with ❤️ for reliable load testing of Microsoft Teams Bots**
