# MCP Servers

Comprehensive Model Context Protocol (MCP) server implementations for the APODS AI-Automation Suite. These servers provide filesystem access, browser automation, and in-memory storage capabilities through a standardized JSON-RPC 2.0 interface.

## Overview

This directory contains three production-ready MCP servers:

1. **Filesystem Server** (`filesystem/`) - File operations, search, and watching
2. **Playwright Server** (`playwright/`) - Browser automation and web scraping
3. **Memory Server** (`memory/`) - In-memory key-value storage with persistence

All servers follow the Model Context Protocol specification and communicate via JSON-RPC 2.0 over standard I/O.

## Architecture

```
mcp-servers/
├── shared/                    # Shared utilities and types
│   ├── types.ts              # Common type definitions
│   ├── utils.ts              # Utility functions
│   └── logger.ts             # Structured logging
├── filesystem/               # Filesystem MCP Server
│   ├── src/
│   │   ├── handlers/        # Request handlers
│   │   └── index.ts         # Main server
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── playwright/               # Playwright MCP Server
│   ├── src/
│   │   ├── handlers/        # Request handlers
│   │   └── index.ts         # Main server
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── memory/                   # Memory MCP Server
│   ├── src/
│   │   ├── handlers/        # Request handlers
│   │   ├── store.ts         # Memory store implementation
│   │   └── index.ts         # Main server
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
└── mcp-servers.json          # Server configuration
```

## Quick Start

### Installation

Install all MCP servers from the root of the project:

```bash
# Install all dependencies
pnpm install

# Build all MCP servers
pnpm build:mcp
```

### Individual Server Installation

```bash
# Install and build filesystem server
pnpm --filter @apods/mcp-filesystem install
pnpm build:mcp:filesystem

# Install and build playwright server
pnpm --filter @apods/mcp-playwright install
pnpm build:mcp:playwright

# Install and build memory server
pnpm --filter @apods/mcp-memory install
pnpm build:mcp:memory
```

### Running Servers

```bash
# Start filesystem server
pnpm start:mcp:filesystem

# Start playwright server
pnpm start:mcp:playwright

# Start memory server
pnpm start:mcp:memory
```

## Server Summaries

### Filesystem Server

Provides secure file system access with:

- File reading/writing with multiple encodings
- Directory listing and creation
- Content and filename search
- Real-time file watching
- Path validation and security

**Key Features:**

- Path traversal protection
- Configurable allowed directories
- Pattern-based search
- Multiple file encodings (UTF-8, Base64, Binary)
- Watch multiple directories simultaneously

[See detailed documentation →](./filesystem/README.md)

### Playwright Server

Browser automation powered by Playwright:

- Page navigation and interaction
- Data extraction and scraping
- Screenshot and PDF generation
- Multi-step automation scripts
- Cookie management

**Key Features:**

- Full browser control (Chromium)
- Wait mechanisms for dynamic content
- Element selection and interaction
- JavaScript execution in page context
- Automation with retry logic

[See detailed documentation →](./playwright/README.md)

### Memory Server

In-memory key-value storage with:

- CRUD operations
- Tag-based organization
- TTL (Time-To-Live) support
- Persistence to disk
- Advanced search capabilities

**Key Features:**

- Metadata support (type, tags, priority)
- Pattern-based operations
- Automatic expiration
- Backup and restore
- Statistics and analytics

[See detailed documentation →](./memory/README.md)

## Configuration

### Server Configuration File

All servers are configured via `mcp-servers.json`:

```json
{
  "servers": [
    {
      "name": "filesystem",
      "enabled": true,
      "config": {
        "allowedDirectories": ["./apps"],
        "maxFileSize": 104857600
      }
    }
  ]
}
```

### Environment Variables

Each server can be configured using environment variables:

**Filesystem Server:**

```bash
ALLOWED_DIRECTORIES="./apps/frontend,./apps/backend"
MAX_FILE_SIZE=104857600
ENABLE_WATCH=true
LOG_LEVEL=info
```

**Playwright Server:**

```bash
HEADLESS=false
VIEWPORT_WIDTH=1280
VIEWPORT_HEIGHT=720
RECORD_VIDEO=false
LOG_LEVEL=info
```

**Memory Server:**

```bash
PERSIST_PATH=./data/memory.json
AUTO_SAVE_MS=60000
CLEANUP_INTERVAL_MS=300000
LOG_LEVEL=info
```

## Protocol

All servers implement JSON-RPC 2.0:

### Request Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "fs.read",
  "params": {
    "path": "./file.txt"
  }
}
```

### Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": "file contents"
  }
}
```

### Error Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid parameters"
  }
}
```

## Common Features

All servers include:

### Health Checks

```json
{
  "method": "server.health",
  "params": {}
}
```

Returns:

- Server status (healthy, degraded, unhealthy)
- Uptime
- Check results

### Server Info

```json
{
  "method": "server.info",
  "params": {}
}
```

Returns:

- Server name and version
- Capabilities
- Configuration
- Statistics

### Capabilities

```json
{
  "method": "server.capabilities",
  "params": {}
}
```

Returns list of supported methods.

## Error Codes

Standard JSON-RPC 2.0 error codes:

| Code   | Name                | Description           |
| ------ | ------------------- | --------------------- |
| -32700 | Parse Error         | Invalid JSON          |
| -32600 | Invalid Request     | Invalid JSON-RPC      |
| -32601 | Method Not Found    | Unknown method        |
| -32602 | Invalid Params      | Invalid parameters    |
| -32603 | Internal Error      | Server error          |
| -32000 | Server Error        | Generic server error  |
| -32001 | Rate Limit Exceeded | Too many requests     |
| -32002 | Unauthorized        | Authentication failed |
| -32003 | Forbidden           | Access denied         |
| -32004 | Not Found           | Resource not found    |
| -32005 | Validation Error    | Validation failed     |

## Security

### Path Validation (Filesystem)

- All paths are normalized and validated
- Path traversal attacks prevented
- Only allowed directories accessible

### Rate Limiting

- Optional rate limiting on all servers
- Configurable limits per time window
- Per-client tracking

### Input Validation

- All parameters validated before processing
- Type checking and constraint validation
- Detailed error messages

### Sandboxing

- JavaScript execution sandboxed (Playwright)
- File operations restricted to allowed directories
- No arbitrary command execution

## Development

### Building

```bash
# Build all servers
pnpm build:mcp

# Build specific server
pnpm build:mcp:filesystem
pnpm build:mcp:playwright
pnpm build:mcp:memory
```

### Development Mode

```bash
# Watch mode for filesystem server
cd apps/mcp-servers/filesystem
pnpm dev
```

### Testing

```bash
# Run tests for all servers
pnpm test

# Test specific server
pnpm --filter @apods/mcp-filesystem test
```

### Linting

```bash
# Lint all servers
pnpm lint

# Lint and fix
pnpm lint:fix
```

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
try {
  const result = await operation();
  return createSuccessResponse(id, result);
} catch (error) {
  logger.error('Operation failed', { error: error.message });
  return createErrorResponse(id, ErrorCode.InternalError, error.message);
}
```

### 2. Logging

Use structured logging:

```typescript
logger.info('Operation completed', {
  operation: 'read',
  path: '/file.txt',
  size: 1024,
});
```

### 3. Validation

Validate all inputs:

```typescript
const validation = validateParams(params, [
  { name: 'path', type: 'string', required: true },
  { name: 'encoding', type: 'string', required: false },
]);

if (!validation.valid) {
  return createErrorResponse(id, ErrorCode.InvalidParams, validation.errors);
}
```

### 4. Resource Cleanup

Always clean up resources:

```typescript
async shutdown() {
  await this.store.shutdown();
  if (this.browser) {
    await this.browser.close();
  }
}
```

## Performance

### Optimization Tips

1. **Filesystem Server**
   - Set appropriate file size limits
   - Use streaming for large files
   - Limit search results

2. **Playwright Server**
   - Run in headless mode in production
   - Disable video recording unless needed
   - Use appropriate wait strategies

3. **Memory Server**
   - Set TTL for temporary data
   - Run cleanup regularly
   - Use batch operations when possible

### Monitoring

Monitor these metrics:

- Request count and rate
- Error rate
- Response time (p95, p99)
- Resource usage (memory, CPU)
- Active connections

## Troubleshooting

### Common Issues

**Server won't start:**

```bash
# Check if port is in use
# Check logs for errors
# Verify configuration
```

**High memory usage:**

```bash
# Memory server: Check store size
# Playwright: Disable video recording
# Set appropriate limits
```

**Slow performance:**

```bash
# Enable headless mode (Playwright)
# Reduce search scope (Filesystem)
# Implement caching
```

### Debugging

Enable debug logging:

```bash
LOG_LEVEL=debug pnpm start:mcp:filesystem
```

Check logs:

```bash
# If log to file enabled
tail -f ./logs/filesystem-mcp-*.log
```

## Contributing

When adding new features:

1. Update type definitions in `shared/types.ts`
2. Add handler in appropriate server
3. Update server capabilities
4. Add tests
5. Update documentation

## Roadmap

Future enhancements:

- [ ] WebSocket transport support
- [ ] HTTP/REST transport support
- [ ] Authentication and authorization
- [ ] Distributed memory store
- [ ] Additional browser engines (Firefox, Safari)
- [ ] Database MCP server
- [ ] API integration MCP server

## License

MIT

## Support

For issues, questions, or contributions:

- GitHub: [rblake2320/apods-ai-automation-suite](https://github.com/rblake2320/apods-ai-automation-suite)
- Documentation: See individual server READMEs
