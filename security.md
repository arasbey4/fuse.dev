# Security

FUSE.DEV treats AI output, project files, IPC messages, plugin requests, and external tool output as untrusted.

Implemented controls:

- `contextIsolation: true`
- `nodeIntegration: false`
- narrow preload API
- IPC schema validation
- workspace path normalization
- workspace containment checks
- command risk classification
- permission engine
- redacted logging

Security tests currently cover:

- path traversal rejection
- workspace write/read enforcement
- command classification
- permission defaults
- agent state transitions

Planned controls:

- OS keychain-backed secrets
- plugin host sandboxing
- MCP server capability isolation
- broader malicious command fixtures
- Electron E2E security tests
