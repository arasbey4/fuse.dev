# FUSE.DEV Architecture

FUSE.DEV is an AI-native desktop development environment built around explicit security boundaries and observable agent behavior.

## Runtime Boundary

```text
Renderer
  -> Preload API
  -> Typed IPC
  -> Main process services
  -> Filesystem / Process / Git / AI / Tools
```

The renderer cannot access Node.js directly. It can only call domain-specific APIs exposed by the preload script.

## Package Structure

```text
apps/desktop         Electron desktop app
packages/protocol    Shared IPC schemas and DTOs
packages/errors      Structured error model
packages/logging     Redacting structured logger
packages/permissions Permission decisions and command policy
packages/security    Shared security helpers
packages/config      Settings schemas
packages/filesystem  Workspace-scoped file service
packages/process     Command execution and shell sessions
packages/git         Git CLI service
packages/ai          Provider-neutral AI interfaces
packages/context     Project context builder
packages/agent       Agent state machine
packages/tools       Tool registry
packages/memory      Inspectable memory store foundation
packages/plugin-sdk  Plugin manifest/API types
```

## Current Implementation

Implemented:

- Secure Electron shell
- React workbench
- Project explorer
- Monaco file editing
- Integrated terminal sessions
- Git status/diff/log
- Settings persistence
- OpenAI-compatible streaming provider foundation
- Permission and tool registry foundations
- Tests for core security behavior

Experimental:

- AI chat streaming, dependent on user-configured provider settings
- Agent runtime state machine foundation

Planned:

- Reviewable AI code edits
- MCP adapters
- Docker/database/browser tool providers
- Plugin host process
- Language-server diagnostics
