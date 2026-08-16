## ⚠️ IMPORTANT: TEST FILES

> **Please read this before attempting to run the project.**

The files currently added to this repository are **TEST FILES and DEVELOPMENT FILES**.

They are **NOT the final working files of FUSE.DEV**.

The project is still under active development, and there are still many files, systems, components, and dependencies that will be added to the repository.

### Do NOT try to run the current files as a complete application.

The current files may:

- Not run independently
- Be incomplete
- Depend on files that have not been uploaded yet
- Contain experimental implementations
- Be missing required dependencies
- Be missing required configuration
- Change or be replaced during development

This is expected.

The repository is currently being built step by step.

```text
Current Repository

✓ Test files
✓ Experimental files
✓ Development files
✓ Early implementations

✗ Complete application
✗ Final release
✗ Production-ready build
# FUSE.DEV

Build. Think. Ship.

FUSE.DEV is an open-source AI-native desktop development environment. It is built around a secure Electron shell, a React workbench, Monaco editing, real filesystem access through controlled services, integrated terminal sessions, Git inspection, provider-neutral AI chat, and an extensible agent/tool foundation.

## Current Status

Implemented:

- Electron + React + TypeScript desktop shell
- Secure preload bridge with typed IPC
- Project opening through the native folder picker
- Workspace-scoped filesystem service
- Project explorer with real directory and file operations
- Monaco editor tabs with save support and dirty indicators
- Integrated terminal backed by real child processes
- Git status, branch, log, and diff services
- Settings persistence for non-secret preferences
- Session-only AI secret handling
- OpenAI-compatible streaming provider foundation
- Tool registry, permission engine, command classifier, and agent state machine foundation
- Core tests for path validation, command security, permissions, and agent transitions

Planned:

- Full agentic code editing workflow with reviewable diffs
- Durable OS keychain secret storage
- Language server integration
- MCP, Docker, database, browser automation, and plugin runtime execution
- Electron end-to-end test suite

## Technology

- Electron
- React
- TypeScript
- Vite / electron-vite
- Monaco Editor
- xterm.js
- npm workspaces
- Vitest

## Development

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run build
npm run typecheck
npm run lint
npm run test
npm run format:check
```

## Architecture

Renderer code has no direct Node.js access. Privileged operations flow through:

```text
Renderer -> Preload -> Typed IPC -> Main process services -> Filesystem / Process / Git / AI / Tools
```

See [docs/architecture.md](docs/architecture.md) for the complete architecture.

## Security

FUSE treats AI output, repository content, plugin requests, and IPC payloads as untrusted input. Filesystem paths are workspace-scoped, commands are classified before execution, and agent tools pass through permission checks.

See [docs/security.md](docs/security.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
