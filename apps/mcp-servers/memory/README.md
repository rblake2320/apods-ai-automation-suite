# Memory MCP Server

A production-ready Model Context Protocol (MCP) server providing in-memory key-value storage with persistence, TTL support, tagging, and advanced search capabilities.

## Features

- **CRUD Operations**
  - Store, update, retrieve, and delete key-value pairs
  - Batch operations for efficiency
  - Existence checking

- **Advanced Search**
  - Search by key pattern (regex)
  - Search by tags (with AND/OR logic)
  - Search by type
  - Flexible sorting and pagination

- **Metadata Support**
  - Custom types for categorization
  - Tag-based organization
  - Priority levels
  - TTL (Time-To-Live) for automatic expiration
  - Automatic timestamp tracking (created, updated, accessed)

- **Persistence**
  - Optional file-based persistence
  - Auto-save with configurable intervals
  - Manual persist on-demand
  - Backup and restore functionality

- **Maintenance**
  - Automatic expired entry cleanup
  - Pattern-based deletion
  - Tag-based deletion
  - Statistics and analytics

## Installation

```bash
cd apps/mcp-servers/memory
pnpm install
pnpm build
```

## Configuration

Configure the server using environment variables:

```bash
# Persistence
PERSIST_PATH=./data/memory.json  # Path to persist data
AUTO_SAVE_MS=60000              # Auto-save interval (default: 1 minute)
CLEANUP_INTERVAL_MS=300000      # Cleanup interval (default: 5 minutes)

# Rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=200
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

### Storage Operations

#### memory.store

Store a key-value pair with optional metadata.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "memory.store",
  "params": {
    "key": "user:123",
    "value": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "metadata": {
      "type": "user",
      "tags": ["active", "premium"],
      "ttl": 3600000,
      "priority": 1
    }
  }
}
```

**Metadata fields:**

- `type` (string, optional): Category/type of the entry
- `tags` (string[], optional): Tags for organization
- `ttl` (number, optional): Time-to-live in milliseconds
- `priority` (number, optional): Priority level (higher = more important)

#### memory.update

Update an existing entry's value and/or metadata.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "memory.update",
  "params": {
    "key": "user:123",
    "value": {
      "name": "John Doe",
      "email": "newemail@example.com"
    },
    "metadata": {
      "tags": ["active", "premium", "verified"]
    }
  }
}
```

#### memory.batchStore

Store multiple entries at once.

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "memory.batchStore",
  "params": {
    "entries": [
      {
        "key": "user:123",
        "value": { "name": "John" },
        "metadata": { "type": "user" }
      },
      {
        "key": "user:456",
        "value": { "name": "Jane" },
        "metadata": { "type": "user" }
      }
    ]
  }
}
```

#### memory.exists

Check if a key exists.

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "memory.exists",
  "params": {
    "key": "user:123"
  }
}
```

### Retrieval Operations

#### memory.retrieve

Retrieve a value by key.

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "memory.retrieve",
  "params": {
    "key": "user:123"
  }
}
```

**Updates the accessed timestamp automatically.**

#### memory.retrieveMultiple

Retrieve multiple values at once.

```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "memory.retrieveMultiple",
  "params": {
    "keys": ["user:123", "user:456", "user:789"]
  }
}
```

#### memory.list

List all keys with pagination.

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "memory.list",
  "params": {
    "limit": 50,
    "offset": 0
  }
}
```

#### memory.keys

Get all keys, optionally filtered by pattern.

```json
{
  "jsonrpc": "2.0",
  "id": 8,
  "method": "memory.keys",
  "params": {
    "pattern": "^user:"
  }
}
```

#### memory.size

Get the total number of entries.

```json
{
  "jsonrpc": "2.0",
  "id": 9,
  "method": "memory.size",
  "params": {}
}
```

### Search Operations

#### memory.search

Advanced search with multiple criteria.

```json
{
  "jsonrpc": "2.0",
  "id": 10,
  "method": "memory.search",
  "params": {
    "pattern": "^user:",
    "type": "user",
    "tags": ["active"],
    "limit": 100,
    "offset": 0,
    "sortBy": "created",
    "sortOrder": "desc"
  }
}
```

**Search parameters:**

- `key` (string): Exact key match
- `pattern` (string): Regex pattern for key matching
- `tags` (string[]): Tags to match (all must be present)
- `type` (string): Type to match
- `limit` (number): Max results
- `offset` (number): Pagination offset
- `sortBy` (string): 'created' | 'updated' | 'accessed' | 'priority'
- `sortOrder` (string): 'asc' | 'desc'

#### memory.searchByTag

Search entries by tags.

```json
{
  "jsonrpc": "2.0",
  "id": 11,
  "method": "memory.searchByTag",
  "params": {
    "tags": ["active", "premium"],
    "matchAll": true,
    "limit": 100
  }
}
```

**Parameters:**

- `matchAll` (boolean): If true, all tags must match (AND). If false, any tag matches (OR).

#### memory.searchByType

Search entries by type.

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "memory.searchByType",
  "params": {
    "type": "user",
    "limit": 100
  }
}
```

#### memory.getStats

Get statistics about the memory store.

```json
{
  "jsonrpc": "2.0",
  "id": 13,
  "method": "memory.getStats",
  "params": {}
}
```

**Returns:**

- Total number of entries
- Total size in bytes
- Breakdown by type
- Breakdown by tag
- Oldest and newest entry timestamps

### Deletion Operations

#### memory.delete

Delete a single key.

```json
{
  "jsonrpc": "2.0",
  "id": 14,
  "method": "memory.delete",
  "params": {
    "key": "user:123"
  }
}
```

#### memory.deleteMultiple

Delete multiple keys at once.

```json
{
  "jsonrpc": "2.0",
  "id": 15,
  "method": "memory.deleteMultiple",
  "params": {
    "keys": ["user:123", "user:456"]
  }
}
```

#### memory.deleteByPattern

Delete all keys matching a pattern.

```json
{
  "jsonrpc": "2.0",
  "id": 16,
  "method": "memory.deleteByPattern",
  "params": {
    "pattern": "^temp:"
  }
}
```

#### memory.deleteByTag

Delete all entries with specific tags.

```json
{
  "jsonrpc": "2.0",
  "id": 17,
  "method": "memory.deleteByTag",
  "params": {
    "tags": ["expired"],
    "matchAll": false
  }
}
```

#### memory.deleteExpired

Delete all expired entries (based on TTL).

```json
{
  "jsonrpc": "2.0",
  "id": 18,
  "method": "memory.deleteExpired",
  "params": {}
}
```

**Runs automatically based on CLEANUP_INTERVAL_MS.**

#### memory.clear

Clear all entries (requires confirmation).

```json
{
  "jsonrpc": "2.0",
  "id": 19,
  "method": "memory.clear",
  "params": {
    "confirm": true
  }
}
```

### Persistence Operations

#### memory.persist

Manually persist data to disk.

```json
{
  "jsonrpc": "2.0",
  "id": 20,
  "method": "memory.persist",
  "params": {}
}
```

#### memory.backup

Create a backup of the current state.

```json
{
  "jsonrpc": "2.0",
  "id": 21,
  "method": "memory.backup",
  "params": {
    "path": "./backups/memory-backup-2024-01-01.json"
  }
}
```

#### memory.restore

Restore from a backup file.

```json
{
  "jsonrpc": "2.0",
  "id": 22,
  "method": "memory.restore",
  "params": {
    "path": "./backups/memory-backup-2024-01-01.json"
  }
}
```

### Server Operations

#### server.info / server.health / server.capabilities

Get server information, health status, or capabilities.

```json
{
  "jsonrpc": "2.0",
  "id": 23,
  "method": "server.health",
  "params": {}
}
```

## Use Cases

### Session Management

```json
{
  "method": "memory.store",
  "params": {
    "key": "session:abc123",
    "value": { "userId": "123", "loginTime": "2024-01-01T00:00:00Z" },
    "metadata": {
      "type": "session",
      "tags": ["active"],
      "ttl": 1800000
    }
  }
}
```

### Cache

```json
{
  "method": "memory.store",
  "params": {
    "key": "cache:api:users:list",
    "value": [{ "id": 1, "name": "John" }],
    "metadata": {
      "type": "cache",
      "tags": ["api"],
      "ttl": 300000
    }
  }
}
```

### Feature Flags

```json
{
  "method": "memory.store",
  "params": {
    "key": "flag:new-ui",
    "value": { "enabled": true, "rollout": 0.5 },
    "metadata": {
      "type": "feature-flag",
      "tags": ["ui"],
      "priority": 2
    }
  }
}
```

### Configuration

```json
{
  "method": "memory.store",
  "params": {
    "key": "config:database",
    "value": { "host": "localhost", "port": 5432 },
    "metadata": {
      "type": "config",
      "tags": ["database"]
    }
  }
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
| -32004 | Not Found           | Key not found            |
| -32001 | Rate Limit Exceeded | Too many requests        |

## Best Practices

1. **Use Namespaces**: Prefix keys with namespaces (e.g., `user:`, `session:`, `cache:`)
2. **Set TTL**: Use TTL for temporary data to enable automatic cleanup
3. **Use Tags**: Organize entries with tags for easier bulk operations
4. **Type Everything**: Use the `type` metadata field for better organization
5. **Regular Backups**: Create backups before major operations
6. **Monitor Stats**: Use `getStats` to monitor memory usage
7. **Clean Expired**: Run `deleteExpired` periodically or rely on auto-cleanup

## Performance

- O(1) operations for get/set/delete by key
- O(n) operations for search and pattern matching
- Efficient in-memory storage using JavaScript Map
- Optional persistence with atomic writes
- Auto-save batches writes for efficiency

## Security Considerations

1. **Key Validation**: Keys are validated to prevent injection attacks
2. **Rate Limiting**: Optional rate limiting to prevent abuse
3. **Atomic Writes**: Persistence uses atomic write operations
4. **Error Handling**: Detailed error messages without exposing sensitive data
5. **Memory Limits**: Monitor memory usage and implement limits as needed

## Limitations

- Maximum memory limited by available RAM
- Large values may impact serialization performance
- Search operations scan all entries (consider indexing for large datasets)
- Persistence is single-threaded (one write at a time)

## License

MIT
