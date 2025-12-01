# k6 Load Tests for MS Teams Bot

Simple load testing suite for the **workoflow-bot** Microsoft Teams Bot using [k6](https://k6.io/), Grafana's open-source load testing tool.

## 🎯 Overview

This project provides a straightforward load testing environment for testing the workoflow-bot. It includes:

- ✅ **Simple Setup** - Single `BOT_ENDPOINT` variable
- ✅ **No Authentication Complexity** - Uses `LOAD_TEST_MODE=true`
- ✅ **Full Workflow Testing** - Tests bot message processing and n8n webhook calls
- ✅ **Best Practice Test Scenarios** - Smoke tests and load tests
- ✅ **Comprehensive Documentation**

### How It Works

The bot runs in `LOAD_TEST_MODE=true` which:
- ✅ Receives and processes messages normally
- ✅ Calls the n8n webhook (testing the full workflow)
- ✅ Skips sending Bot Framework replies (avoiding authentication requirements)

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Node.js** >= 18.0.0
2. **k6** installed ([Installation Guide](https://k6.io/docs/get-started/installation/))
3. **workoflow-bot** running locally with `LOAD_TEST_MODE=true`

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

Copy `.env.example` to `.env` (already done by default):

```bash
cp .env.example .env
```

The default configuration uses `http://localhost:3978/api/messages`. To test a different endpoint:

```bash
# Edit .env and change BOT_ENDPOINT
BOT_ENDPOINT=https://your-bot.azurewebsites.net/api/messages
```

### 3. Start the Bot in Load Test Mode

In the workoflow-bot directory:

```bash
cd ../workoflow-bot
LOAD_TEST_MODE=true npm start
```

### 4. Run Smoke Test

Verify connectivity with a smoke test:

```bash
npm run smoke
```

### 5. Run Load Test

Once the smoke test passes, run the full load test:

```bash
npm test
```

## 📁 Project Structure

```
k6-load-tests/
├── tests/                       # k6 test scripts
│   ├── simple-message.test.js  # Basic message load test
│   └── smoke.test.js           # Connectivity smoke test
│
├── scripts/                     # Helper scripts
│   └── verify-setup.js         # Verify setup configuration
│
├── .env                         # Environment configuration
├── .env.example                 # Template environment file
├── package.json                 # Node.js dependencies
├── README.md                    # This file
└── CHANGELOG.md                 # Version history
```

## 🔧 Configuration

All configuration is done through environment variables in `.env`:

```bash
# Bot endpoint to test (local or remote)
BOT_ENDPOINT=http://localhost:3978/api/messages

# Test configuration
TEST_MESSAGE=test

# Load Test User Identity
TEST_USER_ID=29:load-test-user
TEST_USER_NAME="Load Test User"
TEST_USER_AAD_OBJECT_ID=45908692-019e-4436-810c-b417f58f5f4f
```

You can also override these via command line:

```bash
# Test a different endpoint
BOT_ENDPOINT=https://stage-bot.azurewebsites.net/api/messages npm test

# Test with a different message
TEST_MESSAGE="Hello bot!" npm test

# Or use k6 directly
k6 run --env BOT_ENDPOINT=http://remote-bot:3978/api/messages tests/simple-message.test.js
```

## 🔧 How It Works

### Message Flow

1. **k6 sends message** → Bot endpoint (from `BOT_ENDPOINT` variable)
2. **Bot receives message** → Processes it normally
3. **Bot calls n8n webhook** → Full workflow is tested
4. **Bot skips reply** → No Bot Framework authentication needed (LOAD_TEST_MODE)
5. **Bot returns 200/202** → Test passes

### Activity Structure

Messages sent to the bot follow the Bot Framework Activity schema:

```javascript
{
  type: "message",
  id: "load-test-<timestamp>-<random>",
  timestamp: "2025-10-31T10:30:00Z",
  channelId: "msteams",

  from: {
    id: "29:load-test-user",
    name: "Load Test User",
    aadObjectId: "45908692-019e-4436-810c-b417f58f5f4f",
    role: "user"
  },

  recipient: {
    id: "workoflow-bot",
    name: "Workoflow Bot",
    role: "bot"
  },

  conversation: {
    id: "test-conversation-<timestamp>",
    conversationType: "personal",
    isGroup: false
  },

  text: "test",
  textFormat: "plain",
  locale: "en-US",
  serviceUrl: "https://smba.trafficmanager.net/teams"
}
```

### Load Test Profile

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
✓ response time < 2000ms

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

### Bot Not Started in Load Test Mode

**Problem:** Tests fail with errors

**Solution:** Ensure the bot is started with `LOAD_TEST_MODE=true`:

```bash
cd ../workoflow-bot
LOAD_TEST_MODE=true npm start
```

### Connection Timeout

**Problem:** Requests timeout or take too long

**Solutions:**
1. Check that the bot is running: `curl http://localhost:3978/api/health`
2. Verify `BOT_ENDPOINT` is correct in `.env`
3. Check bot application logs for errors
4. Ensure n8n webhook is accessible

### 500 Internal Server Error

**Problem:** Bot returns 500 status code

**Solutions:**
1. Check bot logs for errors
2. Verify n8n webhook URL is configured correctly in workoflow-bot
3. Ensure n8n is running and healthy
4. Confirm `LOAD_TEST_MODE=true` is set in workoflow-bot

### Wrong Endpoint

**Problem:** Tests can't connect to bot

**Solution:** Check your BOT_ENDPOINT configuration:

```bash
# View current configuration
cat .env | grep BOT_ENDPOINT

# Test the endpoint manually
curl -X POST http://localhost:3978/api/messages \
  -H "Content-Type: application/json" \
  -d '{"type":"message","text":"test"}'
```

## 🎨 Customizing Tests

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

Use the `TEST_MESSAGE` environment variable:

```bash
TEST_MESSAGE="Hello, bot! This is a custom test." npm test
```

Or modify in `.env`:

```bash
TEST_MESSAGE=Custom test message
```

### Testing Different Endpoints

```bash
# Test local bot
BOT_ENDPOINT=http://localhost:3978/api/messages npm test

# Test remote bot
BOT_ENDPOINT=https://your-bot.azurewebsites.net/api/messages npm test

# Test staging
BOT_ENDPOINT=https://stage-bot.example.com/api/messages npm test
```

## 🔐 Security Best Practices

1. **Only use LOAD_TEST_MODE for testing** - Never in production
2. **Limit production testing** - Only test production with explicit authorization
3. **Monitor bot logs** - Watch for unusual activity during tests
4. **Use test webhooks** - Point to test n8n instances, not production
5. **Rate limiting** - Be respectful of rate limits when testing remote endpoints

## 📝 Available npm Scripts

```bash
npm test         # Run full load test
npm run smoke    # Run smoke test (quick connectivity check)
npm run verify   # Verify setup configuration
```

## ☁️ Running on Grafana Cloud

You can run k6 tests on Grafana Cloud for distributed load testing, persistent dashboards, and trend analysis.

### Step 1: Create Grafana Cloud Account

1. Go to [grafana.com/products/cloud](https://grafana.com/products/cloud/)
2. Sign up for a free account (includes k6 Cloud free tier: 50 VUh/month)
3. Navigate to **k6** in the left sidebar

### Step 2: Get Your API Token

1. In Grafana Cloud, go to **k6 → Settings → API Tokens**
2. Click **Generate Token**
3. Copy the token (you'll only see it once!)

### Step 3: Authenticate k6 CLI

```bash
# Option A: Interactive login
k6 cloud login

# Option B: Use environment variable (recommended for CI/CD)
export K6_CLOUD_TOKEN=<YOUR_API_TOKEN>
```

### Step 4: Run Tests on Grafana Cloud

There are **two modes** to run tests:

#### Mode 1: Cloud Execution (tests run on Grafana's infrastructure)

```bash
# Basic cloud run
k6 cloud run tests/stress-breakpoint.test.js

# With environment variables (use -e flag)
k6 cloud run \
  -e BOT_ENDPOINT="https://bot.vcec.cloud/api/messages" \
  -e LOAD_TEST_API_KEY="your-api-key-here" \
  tests/stress-breakpoint.test.js
```

#### Mode 2: Local Execution + Cloud Streaming (run locally, results in cloud)

```bash
# Run locally but stream results to Grafana Cloud dashboard
k6 cloud run --local-execution \
  -e BOT_ENDPOINT="https://bot.vcec.cloud/api/messages" \
  -e LOAD_TEST_API_KEY="your-api-key-here" \
  tests/stress-breakpoint.test.js

# Alternative syntax (older but still works)
k6 run --out cloud \
  -e BOT_ENDPOINT="https://bot.vcec.cloud/api/messages" \
  -e LOAD_TEST_API_KEY="your-api-key-here" \
  tests/stress-breakpoint.test.js
```

### Environment Variables Summary

| Method | Syntax | Use Case |
|--------|--------|----------|
| `-e` flag | `k6 cloud run -e VAR=value` | Script-specific variables |
| System env | `export VAR=value && k6 cloud run` | CI/CD pipelines |
| `K6_CLOUD_TOKEN` | `export K6_CLOUD_TOKEN=xxx` | Authentication |

### CI/CD Integration (GitHub Actions)

```yaml
name: Load Test

on:
  workflow_dispatch:
  schedule:
    - cron: '0 6 * * 1'  # Weekly on Monday

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
            --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
            | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update && sudo apt-get install k6

      - name: Run k6 Cloud Test
        env:
          K6_CLOUD_TOKEN: ${{ secrets.K6_CLOUD_TOKEN }}
        run: |
          k6 cloud run \
            -e BOT_ENDPOINT="${{ secrets.BOT_ENDPOINT }}" \
            -e LOAD_TEST_API_KEY="${{ secrets.LOAD_TEST_API_KEY }}" \
            tests/stress-breakpoint.test.js
```

### Grafana Cloud vs Local Execution

| Feature | Local (`k6 run`) | Cloud (`k6 cloud run`) |
|---------|------------------|------------------------|
| Execution location | Your machine | Grafana's infrastructure |
| Distributed load | Single machine | Multiple regions |
| Results storage | Local JSON/CSV | Persistent cloud dashboard |
| Trend analysis | Manual | Built-in graphs & comparisons |
| Sharing results | Export files | Share URL |
| Max VUs | Limited by machine | Scales to thousands |
| Cost | Free | Free tier: 50 VUh/month |

### Viewing Results

After running a cloud test:
1. k6 outputs a URL to your test results
2. Open the URL in your browser
3. View real-time metrics, graphs, and analysis
4. Compare with previous test runs
5. Share the URL with your team

## 🤝 Contributing

To add new features or tests:

1. Create a new branch
2. Add your changes
3. Test thoroughly with `npm run smoke` then `npm test`
4. Update documentation
5. Submit a pull request

## 📝 License

MIT

## 🆘 Support

For issues or questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review k6 documentation: https://k6.io/docs/
3. Check the bot application logs in `workoflow-bot`
4. Verify `LOAD_TEST_MODE=true` is set in the bot

## 📚 Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Test Types](https://k6.io/docs/test-types/introduction/)
- [Bot Framework Activity Schema](https://docs.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-connector-api-reference)

---

**Built with ❤️ for reliable load testing of Microsoft Teams Bots**
