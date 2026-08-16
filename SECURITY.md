# Security Policy

FUSE.DEV is a desktop development environment with access to local projects and developer tools. Security-sensitive changes receive extra scrutiny.

## Reporting Vulnerabilities

Please do not publicly disclose security issues before maintainers have had a chance to investigate. Open a private advisory or contact the maintainers through the project security channel once one is published.

## Security Model

Implemented:

- Renderer has no direct Node.js access.
- Privileged operations are exposed through a narrow preload API.
- IPC payloads are schema validated.
- Filesystem access is scoped to opened workspaces.
- Commands are classified before execution.
- AI tools go through a permission engine.
- Logs redact common secret patterns.

Planned:

- OS keychain-backed persistent secret storage.
- Stronger process sandboxing for plugins and MCP tools.
- Expanded command policy and security fixtures.
- Electron end-to-end security tests.
