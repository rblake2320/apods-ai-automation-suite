# Playwright MCP Server

A production-ready Model Context Protocol (MCP) server for browser automation using Playwright. Provides comprehensive browser control, web scraping, testing automation, and data extraction capabilities.

## Features

- **Navigation**
  - Navigate to URLs with configurable wait conditions
  - Go back/forward in browser history
  - Reload pages
  - Get current URL and page title

- **Interactions**
  - Click elements (single, double, right-click)
  - Fill input fields
  - Type text with configurable delays
  - Press keyboard keys
  - Check/uncheck checkboxes
  - Select dropdown options

- **Data Extraction**
  - Extract text, HTML, or attributes from elements
  - Query multiple elements at once
  - Execute custom JavaScript in page context
  - Check element visibility
  - Get element attributes

- **Screenshots & PDF**
  - Full page or viewport screenshots
  - Element-specific screenshots
  - PDF generation
  - Configurable image quality and format

- **Automation**
  - Run multi-step automation scripts
  - Conditional execution
  - Retry mechanisms with backoff
  - Cookie management
  - Custom viewport and user agent

- **Wait Mechanisms**
  - Wait for specific selectors
  - Wait for element states (visible, hidden, attached)
  - Configurable timeouts
  - Wait for arbitrary durations

## Installation

```bash
cd apps/mcp-servers/playwright
pnpm install
pnpm build
```

This will automatically install Chromium via Playwright's postinstall script.

## Configuration

Configure the server using environment variables:

```bash
# Browser configuration
HEADLESS=false  # Run in headless mode (default: true)
VIEWPORT_WIDTH=1920
VIEWPORT_HEIGHT=1080
USER_AGENT="Custom User Agent"

# Video recording
RECORD_VIDEO=true
RECORD_VIDEO_DIR=./videos

# Performance
SLOW_MO=100  # Slow down operations by N milliseconds

# Rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=50
RATE_LIMIT_WINDOW_MS=60000

# Logging
LOG_LEVEL=info
LOG_TO_FILE=false
LOG_DIR=./logs
```

## Usage

### Start the Server

```bash
pnpm start
```

### Development Mode

```bash
pnpm start:dev
```

## API Reference

All methods follow JSON-RPC 2.0 protocol.

### Navigation Methods

#### browser.navigate

Navigate to a URL.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "browser.navigate",
  "params": {
    "url": "https://example.com",
    "waitUntil": "networkidle",
    "timeout": 30000
  }
}
```

#### browser.goBack / browser.goForward / browser.reload

Navigate browser history or reload the page.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "browser.goBack",
  "params": {
    "timeout": 30000
  }
}
```

### Interaction Methods

#### browser.click

Click an element.

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "browser.click",
  "params": {
    "selector": "button#submit",
    "button": "left",
    "clickCount": 1,
    "timeout": 30000
  }
}
```

#### browser.fill

Fill an input field.

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "browser.fill",
  "params": {
    "selector": "input[name='email']",
    "value": "user@example.com",
    "timeout": 30000
  }
}
```

#### browser.type

Type text with realistic delays.

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "browser.type",
  "params": {
    "selector": "input#search",
    "text": "search query",
    "delay": 50
  }
}
```

#### browser.press

Press a keyboard key.

```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "browser.press",
  "params": {
    "selector": "input#search",
    "key": "Enter"
  }
}
```

#### browser.select

Select dropdown option(s).

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "browser.select",
  "params": {
    "selector": "select#country",
    "values": ["us", "uk"]
  }
}
```

### Screenshot & PDF Methods

#### browser.screenshot

Take a screenshot.

```json
{
  "jsonrpc": "2.0",
  "id": 8,
  "method": "browser.screenshot",
  "params": {
    "path": "./screenshots/page.png",
    "type": "png",
    "fullPage": true
  }
}
```

**Without path, returns base64-encoded image data.**

#### browser.elementScreenshot

Screenshot a specific element.

```json
{
  "jsonrpc": "2.0",
  "id": 9,
  "method": "browser.elementScreenshot",
  "params": {
    "selector": "div.product-card",
    "type": "png"
  }
}
```

#### browser.pdf

Generate a PDF of the page.

```json
{
  "jsonrpc": "2.0",
  "id": 10,
  "method": "browser.pdf",
  "params": {
    "path": "./pdfs/page.pdf",
    "format": "A4",
    "printBackground": true
  }
}
```

### Extraction Methods

#### browser.extract

Extract data from the page.

```json
{
  "jsonrpc": "2.0",
  "id": 11,
  "method": "browser.extract",
  "params": {
    "selector": "h1.title",
    "format": "text",
    "multiple": false
  }
}
```

**Extract multiple elements:**

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "browser.extract",
  "params": {
    "selector": "div.product",
    "attribute": "data-id",
    "multiple": true
  }
}
```

#### browser.evaluate

Execute JavaScript in page context.

```json
{
  "jsonrpc": "2.0",
  "id": 13,
  "method": "browser.evaluate",
  "params": {
    "script": "(x, y) => x + y",
    "args": [5, 10]
  }
}
```

#### browser.getAttribute

Get element attribute value.

```json
{
  "jsonrpc": "2.0",
  "id": 14,
  "method": "browser.getAttribute",
  "params": {
    "selector": "a.link",
    "attribute": "href"
  }
}
```

#### browser.isVisible

Check if element is visible.

```json
{
  "jsonrpc": "2.0",
  "id": 15,
  "method": "browser.isVisible",
  "params": {
    "selector": "div.modal"
  }
}
```

### Wait Methods

#### browser.waitForSelector

Wait for an element to appear.

```json
{
  "jsonrpc": "2.0",
  "id": 16,
  "method": "browser.waitForSelector",
  "params": {
    "selector": "div.results",
    "state": "visible",
    "timeout": 30000
  }
}
```

#### browser.waitForTimeout

Wait for a specific duration.

```json
{
  "jsonrpc": "2.0",
  "id": 17,
  "method": "browser.waitForTimeout",
  "params": {
    "timeout": 2000
  }
}
```

### Automation Methods

#### browser.runAutomation

Execute a multi-step automation script.

```json
{
  "jsonrpc": "2.0",
  "id": 18,
  "method": "browser.runAutomation",
  "params": {
    "name": "Login Flow",
    "steps": [
      {
        "action": "navigate",
        "params": {
          "url": "https://example.com/login"
        }
      },
      {
        "action": "fill",
        "params": {
          "selector": "input[name='username']",
          "value": "user@example.com"
        }
      },
      {
        "action": "fill",
        "params": {
          "selector": "input[name='password']",
          "value": "password123"
        }
      },
      {
        "action": "click",
        "params": {
          "selector": "button[type='submit']"
        },
        "retry": {
          "maxAttempts": 3,
          "delay": 1000,
          "backoff": "exponential"
        }
      },
      {
        "action": "waitForSelector",
        "params": {
          "selector": "div.dashboard"
        }
      }
    ],
    "config": {
      "viewport": {
        "width": 1280,
        "height": 720
      }
    }
  }
}
```

#### browser.getCookies

Get cookies from the browser context.

```json
{
  "jsonrpc": "2.0",
  "id": 19,
  "method": "browser.getCookies",
  "params": {
    "urls": ["https://example.com"]
  }
}
```

#### browser.setCookies

Set cookies in the browser context.

```json
{
  "jsonrpc": "2.0",
  "id": 20,
  "method": "browser.setCookies",
  "params": {
    "cookies": [
      {
        "name": "session",
        "value": "abc123",
        "domain": "example.com",
        "path": "/"
      }
    ]
  }
}
```

### Server Operations

#### server.info / server.health / server.capabilities

Get server information, health status, or capabilities.

```json
{
  "jsonrpc": "2.0",
  "id": 21,
  "method": "server.health",
  "params": {}
}
```

## Automation Script Actions

The following actions are supported in automation scripts:

- `navigate` - Navigate to URL
- `click` - Click element
- `fill` - Fill input field
- `type` - Type text
- `press` - Press key
- `select` - Select dropdown option
- `check` / `uncheck` - Toggle checkbox
- `screenshot` - Take screenshot
- `extract` - Extract data
- `evaluate` - Run JavaScript
- `waitForSelector` - Wait for element
- `waitForTimeout` - Wait for duration
- `goBack` / `goForward` - Navigate history
- `reload` - Reload page

Each step supports:

- `condition` - JavaScript condition to evaluate before execution
- `retry` - Retry configuration with exponential backoff

## Error Codes

| Code   | Name                | Description              |
| ------ | ------------------- | ------------------------ |
| -32700 | Parse Error         | Invalid JSON             |
| -32600 | Invalid Request     | Invalid JSON-RPC request |
| -32601 | Method Not Found    | Method doesn't exist     |
| -32602 | Invalid Params      | Invalid parameters       |
| -32603 | Internal Error      | Server error             |
| -32004 | Not Found           | Element not found        |
| -32001 | Rate Limit Exceeded | Too many requests        |

## Best Practices

1. **Selector Strategy**: Use unique, stable selectors (data attributes, IDs)
2. **Timeouts**: Adjust timeouts based on your application's responsiveness
3. **Wait Mechanisms**: Use `waitForSelector` instead of `waitForTimeout` when possible
4. **Error Handling**: Implement retry logic for flaky operations
5. **Resource Management**: The browser instance is shared across requests
6. **Screenshots**: Use element screenshots for smaller file sizes
7. **Headless Mode**: Run in headless mode in production for better performance

## Security Considerations

1. **Input Validation**: All parameters are validated before execution
2. **Rate Limiting**: Optional rate limiting to prevent abuse
3. **Script Execution**: JavaScript evaluation is sandboxed to the page context
4. **Cookie Security**: Cookies are scoped to specific domains
5. **Resource Limits**: Configure timeouts to prevent hanging operations

## Performance Tips

- Use `waitUntil: 'domcontentloaded'` for faster navigation
- Enable headless mode in production
- Disable video recording unless needed
- Use element screenshots instead of full page
- Implement proper cleanup in automation scripts

## Troubleshooting

**Browser not launching:**

- Run `playwright install chromium` manually
- Check system dependencies (Linux)

**Timeouts:**

- Increase timeout values
- Check network connectivity
- Verify selectors are correct

**Out of memory:**

- Reduce concurrent operations
- Enable headless mode
- Limit screenshot resolution

## License

MIT
