# Filesystem MCP Server

A production-ready Model Context Protocol (MCP) server for filesystem operations. Provides secure, validated file system access with comprehensive features including file reading/writing, directory operations, search, and real-time file watching.

## Features

- **File Operations**
  - Read files with multiple encodings (UTF-8, Base64, Binary)
  - Write/append files with automatic directory creation
  - Delete files and directories (with recursive option)
  - Partial file reading (offset and length support)

- **Directory Operations**
  - List directory contents (recursive support)
  - Create directories (recursive creation)
  - Pattern-based filtering
  - Hidden file handling

- **Search Capabilities**
  - Content search across files (regex and literal)
  - File name pattern matching
  - Configurable result limits
  - Context extraction for matches

- **File Watching**
  - Real-time file system monitoring
  - Event filtering (add, change, unlink)
  - Recursive directory watching
  - Multiple concurrent watchers

- **Security**
  - Path validation and sanitization
  - Allowed directory restrictions
  - Path traversal protection
  - Rate limiting support

## Installation

```bash
cd apps/mcp-servers/filesystem
pnpm install
pnpm build
```

## Configuration

Configure the server using environment variables:

```bash
# Allowed directories (comma-separated)
ALLOWED_DIRECTORIES="./apps/frontend,./apps/backend,./scripts"

# Maximum file size in bytes (default: 100MB)
MAX_FILE_SIZE=104857600

# Enable/disable file watching (default: true)
ENABLE_WATCH=true

# Rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
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

### File Operations

#### fs.read

Read file contents.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "fs.read",
  "params": {
    "path": "./apps/frontend/src/App.tsx",
    "encoding": "utf8",
    "offset": 0,
    "length": 1000
  }
}
```

**Parameters:**

- `path` (string, required): File path
- `encoding` (string, optional): 'utf8' | 'base64' | 'binary' (default: 'utf8')
- `offset` (number, optional): Byte offset to start reading
- `length` (number, optional): Number of bytes to read

#### fs.write

Write content to a file.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "fs.write",
  "params": {
    "path": "./apps/frontend/src/config.json",
    "content": "{\"version\": \"1.0.0\"}",
    "encoding": "utf8",
    "createDirectory": true,
    "overwrite": true,
    "append": false
  }
}
```

**Parameters:**

- `path` (string, required): File path
- `content` (string, required): File content
- `encoding` (string, optional): 'utf8' | 'base64' | 'binary'
- `createDirectory` (boolean, optional): Create parent directories
- `overwrite` (boolean, optional): Overwrite existing file
- `append` (boolean, optional): Append to existing file

#### fs.delete

Delete a file or directory.

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "fs.delete",
  "params": {
    "path": "./apps/frontend/temp",
    "recursive": true
  }
}
```

### Directory Operations

#### fs.list

List directory contents.

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "fs.list",
  "params": {
    "path": "./apps/frontend/src",
    "recursive": true,
    "includeHidden": false,
    "maxDepth": 3,
    "pattern": "\\.tsx?$"
  }
}
```

#### fs.createDirectory

Create a directory.

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "fs.createDirectory",
  "params": {
    "path": "./apps/frontend/src/components/new",
    "recursive": true
  }
}
```

### Search Operations

#### fs.search

Search for content within files.

```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "fs.search",
  "params": {
    "path": "./apps/frontend/src",
    "pattern": "import.*React",
    "caseSensitive": false,
    "regex": true,
    "maxResults": 100,
    "includeHidden": false,
    "fileTypes": [".ts", ".tsx"]
  }
}
```

#### fs.findFiles

Find files by name pattern.

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "fs.findFiles",
  "params": {
    "path": "./apps/frontend",
    "pattern": ".*\\.test\\.tsx?$",
    "maxResults": 100
  }
}
```

### Watch Operations

#### fs.watch.start

Start watching a path for changes.

```json
{
  "jsonrpc": "2.0",
  "id": 8,
  "method": "fs.watch.start",
  "params": {
    "path": "./apps/frontend/src",
    "recursive": true,
    "events": ["add", "change", "unlink"]
  }
}
```

**Response includes watchId for managing the watch.**

#### fs.watch.stop

Stop an active watch.

```json
{
  "jsonrpc": "2.0",
  "id": 9,
  "method": "fs.watch.stop",
  "params": {
    "watchId": "watch-1234567890-abc123"
  }
}
```

#### fs.watch.list

List all active watches.

```json
{
  "jsonrpc": "2.0",
  "id": 10,
  "method": "fs.watch.list",
  "params": {}
}
```

### Server Operations

#### server.info

Get server information.

```json
{
  "jsonrpc": "2.0",
  "id": 11,
  "method": "server.info",
  "params": {}
}
```

#### server.health

Health check endpoint.

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "server.health",
  "params": {}
}
```

#### server.capabilities

List server capabilities.

```json
{
  "jsonrpc": "2.0",
  "id": 13,
  "method": "server.capabilities",
  "params": {}
}
```

## Error Codes

| Code   | Name                | Description              |
| ------ | ------------------- | ------------------------ |
| -32700 | Parse Error         | Invalid JSON             |
| -32600 | Invalid Request     | Invalid JSON-RPC request |
| -32601 | Method Not Found    | Method doesn't exist     |
| -32602 | Invalid Params      | Invalid parameters       |
| -32603 | Internal Error      | Server error             |
| -32003 | Forbidden           | Access denied            |
| -32004 | Not Found           | Resource not found       |
| -32001 | Rate Limit Exceeded | Too many requests        |

## Security Considerations

1. **Path Validation**: All paths are validated and normalized to prevent path traversal attacks
2. **Allowed Directories**: Only paths within configured allowed directories are accessible
3. **Rate Limiting**: Optional rate limiting to prevent abuse
4. **File Size Limits**: Configurable maximum file size for operations
5. **Error Handling**: Detailed error messages without exposing sensitive system information

## Performance

- Asynchronous I/O operations
- Streaming for large file operations
- Efficient directory traversal
- Configurable result limits for search operations
- File size checks before operations

## Logging

The server provides structured logging with multiple levels:

- `debug`: Detailed operation information
- `info`: General operational messages
- `warn`: Warning messages
- `error`: Error messages with context

Logs can be written to console and/or file based on configuration.

## License

MIT
