# FUSE.DEV Architecture

Status: Architecture document only  
Date: 2026-08-16  
Repository state: Empty project workspace, not yet initialized as a Git repository

## 1. Repository Analysis

The inspected workspace contains only:

```text
outputs/
work/
```

No existing source files, package manifests, lockfiles, Git repository, framework configuration, or implementation code were present at inspection time.

Current conclusions:

- There is no existing application architecture to preserve.
- There are no existing dependencies or package manager decisions.
- There are no existing APIs, naming conventions, tests, build scripts, or CI configuration.
- There is no `.git` directory in the inspected workspace.
- FUSE.DEV can be initialized cleanly, but implementation should begin only after this architecture is accepted as the first technical baseline.

Initial technology choices should optimize for security, maintainability, contributor experience, and long-term portability.

## 2. Product Architecture Principles

FUSE.DEV is not a chat panel inside a code editor. It is an AI-native development environment where the developer remains in control while AI agents perform observable, permissioned work.

Core principles:

- AI actions are explicit, inspectable, cancellable, and permission-gated.
- Renderer code never receives unrestricted Node.js, filesystem, process, shell, Git, credential, or network access.
- All privileged actions flow through typed service APIs.
- Every tool has a schema, permission requirement, timeout, validation layer, structured output, and structured error model.
- Project intelligence and context selection are first-class subsystems, not prompt glue.
- The architecture must remain modular enough to migrate performance-critical or security-critical parts to Rust later.
- Features must reflect reality. No fake Git data, fake AI responses, fake terminals, or pretend buttons.

## 3. Recommended Monorepo Structure

FUSE.DEV should start as a TypeScript monorepo using `pnpm` workspaces.

```text
fuse.dev/
  apps/
    desktop/
      electron/
        main/
        preload/
      renderer/
      tests/
      package.json

  packages/
    protocol/
    config/
    logging/
    errors/
    security/
    permissions/
    filesystem/
    process/
    terminal/
    git/
    ai/
    context/
    project-intelligence/
    indexer/
    agent/
    tools/
    memory/
    plugin-sdk/
    ui/
    editor/

  tests/
    fixtures/
    integration/
    security/
    e2e/

  docs/
    architecture.md
    development.md
    agent-system.md
    security.md
    permissions.md
    ipc.md
    roadmap.md

  scripts/
  .github/
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json
  eslint.config.*
  prettier.config.*
  vitest.config.*
  playwright.config.*
```

Package dependency direction:

```text
apps/desktop
  -> packages/ui
  -> packages/editor
  -> packages/protocol
  -> packages/config

Electron main process
  -> packages/filesystem
  -> packages/process
  -> packages/terminal
  -> packages/git
  -> packages/ai
  -> packages/agent
  -> packages/tools
  -> packages/permissions
  -> packages/security
  -> packages/logging

Core packages
  -> packages/protocol
  -> packages/errors
  -> packages/config
  -> packages/logging
```

Rules:

- `packages/protocol` contains shared types, IPC contracts, event names, schemas, and DTOs.
- `packages/ui` contains reusable presentation components only.
- `packages/editor` owns Monaco integration and editor state abstractions.
- Privileged packages are used by Electron main, workers, or future service processes, not directly by the renderer.
- No package should depend on `apps/desktop`.
- Avoid circular dependencies by treating `protocol`, `errors`, `config`, and `logging` as low-level foundations.

## 4. Runtime Process Architecture

FUSE.DEV should initially use Electron with React and TypeScript.

Primary processes:

```text
Renderer Process
  React UI, Monaco, workspace layout, panels, command palette

Preload Script
  Narrow, typed bridge exposed through contextBridge

Electron Main Process
  Window lifecycle, IPC routing, capability enforcement, service host

Service Layer
  Filesystem, process, terminal, Git, AI, agent, tools, permissions

Worker Processes
  Project indexing, analysis, long-running scans, future language services
```

Security defaults:

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true` where compatible
- Strict Content Security Policy
- No remote module
- No arbitrary IPC channels
- No renderer access to `fs`, `child_process`, environment variables, secrets, or shell execution

Electron request flow:

```text
Renderer
  -> Preload API
  -> Typed IPC contract
  -> IPC router
  -> Permission engine
  -> Service method
  -> Structured result or structured error
```

The preload API should expose domain-specific capabilities, not generic primitives.

Example:

```ts
window.fuse.workspace.openProject();
window.fuse.files.readTextFile({ workspaceId, path });
window.fuse.git.status({ workspaceId });
window.fuse.terminal.createSession({ workspaceId, cwd });
window.fuse.agent.startTask({ workspaceId, goal, context });
```

Avoid:

```ts
window.fs;
window.exec;
window.require;
window.ipcRenderer.send(anything);
```

## 5. Frontend Architecture

The renderer should be a React + TypeScript application using Vite.

Core UI regions:

- Activity bar
- Project explorer
- Editor workbench
- AI assistant panel
- Agent task view
- Source control view
- Problems and diagnostics panel
- Integrated terminal panel
- Status bar
- Command palette
- Settings

Frontend layering:

```text
renderer/
  app/
    App.tsx
    routes-or-workbench.tsx
    providers/

  workbench/
    layout/
    activity-bar/
    explorer/
    editor-area/
    side-panel/
    bottom-panel/
    status-bar/

  features/
    files/
    git/
    terminal/
    ai-chat/
    agent-tasks/
    problems/
    settings/

  state/
    stores/
    queries/

  ipc/
    client.ts
    hooks.ts
```

State management:

- Use local component state for isolated UI interactions.
- Use a small global store such as Zustand for workbench layout, selected workspace, open editors, panel state, and command palette state.
- Use TanStack Query or an equivalent query cache for IPC-backed async data.
- Keep business rules in services/hooks, not in visual components.

UI standards:

- Dense, professional, keyboard-friendly developer interface.
- Resizable panels from the beginning.
- Command palette as a central interaction model.
- Accessible labels, visible focus, semantic controls, and readable contrast.
- No placeholder features that imply working behavior before services exist.

## 6. Editor Architecture

Use Monaco Editor through `@monaco-editor/react` or a carefully managed direct Monaco integration.

Editor responsibilities:

- Open files
- Track dirty state
- Save files through filesystem service
- Support multiple tabs
- Support split editors
- Search and replace
- Surface diagnostics
- Provide syntax highlighting by language
- Preserve editor settings
- Prepare for future LSP integration

Recommended package:

```text
packages/editor/
  src/
    editor-model.ts
    editor-store.ts
    language-registry.ts
    diagnostics.ts
    monaco/
      monaco-host.ts
      model-manager.ts
      worker-config.ts
```

Important boundary:

The editor package may manage in-memory document state, but filesystem reads and writes must go through the secure filesystem service.

## 7. Filesystem and Workspace Architecture

The filesystem subsystem is a privileged service hosted outside the renderer.

Main concepts:

- `Workspace`
- `WorkspaceRoot`
- `WorkspaceRelativePath`
- `FileEntry`
- `FileSnapshot`
- `FileChangeEvent`
- `WriteIntent`

Capabilities:

- Open project
- List directories
- Read text files
- Write files
- Create file/folder
- Rename
- Move
- Delete with explicit permission
- Watch selected roots
- Resolve symlinks safely
- Detect external changes

Security requirements:

- Normalize paths before access.
- Enforce workspace root containment after resolving symlinks.
- Reject path traversal.
- Treat delete, overwrite, and cross-boundary operations as higher risk.
- Never let AI tools access arbitrary paths without explicit permission.
- Protect unsaved editor changes from silent overwrite.

Large repository handling:

- Directory listing should be paginated or bounded.
- Ignore configured directories such as `.git`, `node_modules`, build outputs, caches, and large binary directories by default.
- File watching should debounce events and avoid excessive polling.

## 8. Terminal and Process Architecture

The terminal system should be built on a cross-platform pseudoterminal library such as `node-pty`.

Terminal responsibilities:

- Create shell sessions
- Stream stdout/stderr
- Accept stdin
- Resize terminal
- Track lifecycle and exit codes
- Support multiple sessions
- Respect workspace cwd
- Sanitize environment variables

Process execution should be a separate service shared by terminal, tools, tests, Git where appropriate, and agents.

```text
packages/process/
  process-service.ts
  command-policy.ts
  process-session.ts
  environment-policy.ts
```

Agent command execution must use policy checks, not raw terminal access.

Command risk classes:

- `SAFE`: read-only commands with low blast radius
- `CAUTION`: package installs, scripts, migrations, networked commands
- `DANGEROUS`: deletion, force operations, credential access, system changes
- `BLOCKED`: commands that should never run under default policy

Examples requiring approval:

- `rm -rf`, `Remove-Item -Recurse`, `del /s`
- `git reset --hard`
- `git push --force`
- package installation
- commands outside the workspace
- commands that request administrator privileges

## 9. Git Integration

Git should be exposed through a `GitService`, not arbitrary shell commands.

Initial capabilities:

- Detect repository
- Status
- Diff
- Stage and unstage
- Restore with confirmation
- Commit
- Branch list
- Create branch
- Checkout
- Fetch
- Pull
- Push
- Log

Recommended implementation path:

- Start with Git CLI invocation through the process service for correctness and compatibility.
- Use structured parsers for porcelain output where possible.
- Keep Git operations permission-gated.
- Consider `isomorphic-git` only for targeted future use cases; avoid replacing the Git CLI prematurely.

Destructive operations:

- Restore/discard changes requires explicit confirmation.
- Reset, clean, rebase, force push, branch deletion, and history rewriting require elevated confirmation.
- The AI agent may propose destructive Git actions but must not execute them without approval.

## 10. AI Provider Architecture

FUSE.DEV must not be hard-coded to one model provider.

Core interface:

```ts
interface AIProvider {
  id: string;
  listModels(): Promise<ModelInfo[]>;
  generateText(request: GenerateTextRequest): Promise<GenerateTextResult>;
  streamText(request: GenerateTextRequest): AsyncIterable<AIStreamEvent>;
  generateStructured<T>(request: StructuredRequest<T>): Promise<T>;
  supports(capability: AICapability): boolean;
}
```

Provider packages:

```text
packages/ai/
  src/
    provider.ts
    registry.ts
    streaming.ts
    usage.ts
    errors.ts
    providers/
      openai.ts
      anthropic.ts
      gemini.ts
      ollama.ts
      openai-compatible.ts
```

Required provider behavior:

- Streaming
- Cancellation
- Timeouts
- Retries with backoff
- Usage metadata
- Tool calling where supported
- Structured output validation
- Redacted logging

Secrets:

- API keys are stored using OS secure storage.
- Secrets are never committed.
- Renderer never receives raw provider secrets.
- Logs must redact keys, tokens, and credentials.

## 11. Context Architecture

The context system decides what the model sees.

Inputs:

- User request
- Explicit selected files
- Open editor buffers
- Unsaved changes
- Git diff
- Diagnostics
- Project metadata
- Relevant search/index results
- Terminal excerpts
- Task history
- Project memory

Pipeline:

```text
ContextRequest
  -> source collectors
  -> relevance ranking
  -> safety filtering
  -> token budgeting
  -> compression/summarization
  -> final context bundle
```

Priority order:

1. Current user request
2. Explicit files/selections
3. Current editor buffers and unsaved changes
4. Current Git diff
5. Diagnostics and failing tests
6. Relevant indexed files
7. Project metadata and conventions
8. Terminal excerpts
9. Long-term memory

Do not send entire repositories blindly. Every context bundle should include provenance so the user and agent can understand what was included.

## 12. Project Intelligence

Project intelligence should use modular detectors.

Detector examples:

- `package-json-detector`
- `typescript-detector`
- `vite-detector`
- `next-detector`
- `electron-detector`
- `python-detector`
- `rust-detector`
- `docker-detector`
- `database-detector`
- `test-framework-detector`
- `git-detector`

Output:

```ts
interface ProjectProfile {
  languages: LanguageInfo[];
  frameworks: FrameworkInfo[];
  packageManagers: PackageManagerInfo[];
  buildSystems: BuildSystemInfo[];
  testRunners: TestRunnerInfo[];
  scripts: ScriptInfo[];
  importantFiles: ProjectFileRef[];
  ignoredPaths: string[];
  confidence: number;
}
```

Detectors should be composable, independently testable, and incremental.

## 13. Indexing Architecture

Start with a local file metadata and text index.

Initial index:

- File paths
- File size
- Modified time
- Language
- Imports where cheap to parse
- Headings/symbol-like structures where available
- Text chunks for search

Future index:

- Symbols
- Definitions
- References
- Call graph hints
- Semantic embeddings
- Per-language analyzers

Do not introduce a vector database in the first milestone. Use a local SQLite-backed index or lightweight file-backed store. Add vector search only after the product has clear retrieval needs.

Indexing constraints:

- Incremental updates
- Watcher-driven refresh
- Ignore large/binary/generated paths
- Worker process isolation
- Cancellable scans
- Progress reporting

## 14. Agent Runtime Architecture

The agent runtime is the central AI execution engine.

Core concepts:

- `Goal`
- `Plan`
- `Step`
- `ToolCall`
- `Observation`
- `PermissionRequest`
- `AgentState`
- `RunLimits`
- `FinalReport`

State machine:

```text
IDLE
  -> PLANNING
  -> WAITING_FOR_APPROVAL
  -> EXECUTING
  -> OBSERVING
  -> PLANNING
  -> COMPLETED

Terminal states:
  COMPLETED
  CANCELLED
  FAILED
  BLOCKED
```

Agent limits:

- Maximum iterations
- Maximum wall-clock time
- Maximum tool calls
- Maximum token usage
- Per-tool timeout
- Cancellation signal
- Permission budget

The runtime must not be an infinite autonomous loop. It should be event-sourced enough that the UI can show exactly what happened.

Agent event stream:

```text
agent.run.started
agent.plan.created
agent.permission.requested
agent.tool.started
agent.tool.output
agent.tool.failed
agent.observation.created
agent.state.changed
agent.run.completed
agent.run.failed
agent.run.cancelled
```

## 15. Planner Architecture

The planner converts high-level goals into visible, structured plans.

Planner responsibilities:

- Inspect available context
- Identify likely files and systems
- Propose steps
- Identify required tools and permissions
- Estimate risk
- Decide when approval is required
- Update the plan after observations

Plans should be user-visible and editable later.

Plan schema:

```ts
interface AgentPlan {
  goal: string;
  assumptions: string[];
  steps: AgentPlanStep[];
  risks: RiskNote[];
  requiredPermissions: PermissionRequirement[];
}
```

## 16. Tool System

Only registered tools may execute. Model output must never directly become arbitrary code or function execution.

Tool interface:

```ts
interface Tool<TInput, TOutput> {
  name: string;
  description: string;
  inputSchema: Schema<TInput>;
  outputSchema: Schema<TOutput>;
  permission: PermissionRequirement;
  timeoutMs: number;
  execute(input: TInput, context: ToolExecutionContext): Promise<TOutput>;
}
```

Initial tools:

- `workspace.inspect`
- `filesystem.listDirectory`
- `filesystem.readFile`
- `filesystem.writeFile`
- `filesystem.applyPatch`
- `filesystem.search`
- `process.runCommand`
- `git.status`
- `git.diff`
- `git.stage`
- `git.commit`
- `tests.run`
- `project.analyze`
- `context.build`

Future tools:

- `browser.open`
- `browser.click`
- `browser.screenshot`
- `database.inspectSchema`
- `database.queryReadOnly`
- `docker.listContainers`
- `docker.logs`
- `mcp.invokeTool`

Each tool execution should produce:

- Validated input
- Permission decision
- Start timestamp
- End timestamp
- Structured output
- Structured error if failed
- Redacted logs

## 17. File Editing Engine

AI-generated edits must be reviewable and conflict-aware.

Editing modes:

- Unified patch application
- Exact replacement
- Whole-file write only for new files or explicitly approved rewrites
- Future AST-aware edits for supported languages

Safety checks:

- Resolve target path inside workspace.
- Confirm file still matches expected preimage.
- Detect unsaved editor changes.
- Generate diff before write.
- Preserve file encoding and line endings when possible.
- Reject ambiguous replacements.
- Require permission for overwrite and delete.

The editor UI should be able to show agent-proposed diffs before applying them for higher-risk changes.

## 18. Permission System

The permission system is a core service, not UI state.

Permission categories:

- `filesystem.read`
- `filesystem.write`
- `filesystem.delete`
- `process.execute`
- `network.access`
- `git.read`
- `git.write`
- `git.push`
- `package.install`
- `database.read`
- `database.write`
- `browser.access`
- `docker.read`
- `docker.write`
- `mcp.invoke`
- `system.admin`

Decision values:

- `ALLOW`
- `DENY`
- `ASK`

Scopes:

- Project
- File
- Directory
- Command
- Tool
- Provider
- Session
- Time-limited grant

Policy evaluation:

```text
Tool request
  -> static tool permission
  -> input-specific risk evaluation
  -> workspace scope check
  -> user/session/project policy
  -> decision
```

Permission decisions must be logged without leaking secrets.

## 19. Security Boundaries

Security-sensitive boundaries:

- Renderer to preload
- Preload to main IPC
- Main process to filesystem
- Main process to child process execution
- Agent output to tool invocation
- Tool input to privileged service
- Plugin/MCP integration to tool system
- AI provider secret storage

Threats to defend against:

- Prompt injection causing destructive tool calls
- Path traversal
- Symlink escape
- Malicious IPC payloads
- Arbitrary shell execution
- Credential exfiltration
- Package install side effects
- Plugin capability escalation
- MCP server tool bypass
- Log leakage of secrets

Required controls:

- Runtime schema validation at every boundary
- Deny-by-default permissions for high-risk capabilities
- Command classification
- Workspace path normalization
- Structured error handling
- Audit logs for privileged actions
- No direct renderer access to privileged APIs
- Secret redaction
- Tests for bypass attempts

## 20. MCP Architecture

MCP should be an integration mechanism behind FUSE's permission model.

Architecture:

```text
MCP Server
  -> MCP Client Adapter
  -> Tool Registry Adapter
  -> Permission Engine
  -> Agent Runtime
```

MCP tools must declare or be assigned capabilities. External MCP servers cannot bypass local permissions.

MCP support should be introduced after the native tool registry and permission engine are working.

## 21. Docker Architecture

Docker support should be permission-controlled and optional.

Future services:

- Docker availability detector
- Container listing
- Container inspection
- Start/stop/restart
- Logs
- Images
- Volumes
- Networks
- Compose projects

Default AI permissions:

- Read-only Docker inspection may be allowed after user approval.
- Start/stop/delete operations require explicit approval.
- Direct Docker socket access should not be exposed to arbitrary model-generated commands.

## 22. Database Architecture

Database integration should start with explicit connection profiles.

Future capabilities:

- SQLite local database inspection
- PostgreSQL connection
- MySQL connection
- Schema browser
- Read-only query execution
- Controlled write queries

Security defaults:

- AI database access is read-only by default.
- Destructive statements require explicit approval.
- Credentials are stored securely.
- Query logs redact credentials and sensitive connection strings.

## 23. Browser Automation Architecture

Browser automation should be introduced as a tool provider after permissions and tool registry exist.

Capabilities:

- Open URL
- Navigate
- Click
- Type
- Inspect DOM snapshot
- Screenshot
- Verify UI state
- Run workflow checks

Security:

- User approval for external URLs when needed.
- No automatic credential entry without explicit confirmation.
- Browser actions are logged as agent events.
- Screenshots and DOM snapshots are treated as context artifacts.

## 24. Plugin Architecture

Plugins may eventually provide:

- Commands
- Panels
- Tools
- Themes
- AI providers
- Workflow templates
- Integrations

Plugin manifest:

```ts
interface FusePluginManifest {
  id: string;
  name: string;
  version: string;
  contributes: {
    commands?: CommandContribution[];
    panels?: PanelContribution[];
    tools?: ToolContribution[];
    providers?: ProviderContribution[];
    themes?: ThemeContribution[];
  };
  permissions: PermissionRequirement[];
}
```

Plugin model:

- Start with declarative contributions and limited extension points.
- Run plugin code in a constrained host process when executable plugins are introduced.
- Require explicit permissions.
- Route plugin tools through the same tool registry and permission engine.
- Avoid marketplace complexity until local plugin loading is stable.

## 25. Configuration Architecture

Use schema-validated configuration with layered precedence.

Layers:

1. Application defaults
2. User settings
3. Workspace settings
4. Environment overrides where appropriate
5. Temporary session overrides

Configuration categories:

- Editor
- Terminal
- AI providers
- Models
- Agent limits
- Permissions
- Appearance
- Project indexing
- Logging
- Plugins

Invalid configuration should produce recoverable diagnostics and fallback to safe defaults.

## 26. Logging and Observability

Use structured logs from the beginning.

Log categories:

- Application lifecycle
- IPC requests
- Permission decisions
- Tool execution
- Agent state transitions
- AI provider requests metadata
- Git operations
- Process lifecycle
- Indexing performance
- Errors

Never log:

- API keys
- Passwords
- Tokens
- Full environment variables
- Private credentials
- Raw secrets embedded in commands

Logs should support export for bug reports with redaction.

## 27. Error Handling

Use typed errors across packages.

Error shape:

```ts
interface FuseError {
  code: string;
  category: ErrorCategory;
  message: string;
  details?: unknown;
  recoverable: boolean;
  cause?: unknown;
}
```

Categories:

- `Validation`
- `PermissionDenied`
- `NotFound`
- `Conflict`
- `ProcessFailed`
- `ProviderFailed`
- `Network`
- `Configuration`
- `Internal`

Tools must return structured errors to agents. UI should show user-readable messages with optional technical details.

## 28. Testing Strategy

Testing is mandatory from the first implementation phase.

Recommended stack:

- Vitest for unit and integration tests
- React Testing Library for UI components
- Playwright for Electron end-to-end tests
- IPC contract tests with schema validation
- Security-focused test fixtures

Test layers:

- Unit tests for pure package logic
- Integration tests for filesystem, Git, process, permissions, and tools
- Agent runtime tests with fake providers and fake tools
- UI tests for workbench behavior
- Electron E2E tests for critical flows
- Security regression tests

Critical security tests:

- Path traversal rejection
- Symlink workspace escape rejection
- Unauthorized file write denial
- Unauthorized delete denial
- Dangerous command classification
- Malformed IPC payload rejection
- Malicious tool input rejection
- Permission bypass attempts
- Concurrent edit conflict detection
- Secret redaction
- Process cleanup after cancellation

Minimum validation before a phase is complete:

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e where applicable
```

## 29. Open Source Project Standards

Initial repository files:

- `README.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `LICENSE`
- `CODE_OF_CONDUCT.md`
- `.github/ISSUE_TEMPLATE/*`
- `.github/pull_request_template.md`
- `docs/architecture.md`
- `docs/development.md`
- `docs/security.md`
- `docs/agent-system.md`
- `docs/roadmap.md`

Documentation must distinguish:

- `IMPLEMENTED`
- `PLANNED`
- `EXPERIMENTAL`

No documentation should claim features exist before they are implemented.

## 30. Implementation Roadmap

Each phase must leave the repository buildable and runnable.

### Phase 0: Repository Foundation

Goal: Create the clean open-source project baseline.

Deliverables:

- Git repository initialization if requested
- `pnpm` workspace
- TypeScript strict configuration
- ESLint and Prettier
- Vitest
- Basic docs
- License and contribution files
- CI skeleton

Validation:

- Install dependencies
- Run format check
- Run lint
- Run typecheck
- Run tests

### Phase 1: Secure Desktop Shell

Goal: Build the Electron + React shell with secure IPC.

Deliverables:

- Electron main process
- Secure preload bridge
- React renderer
- Vite build
- Typed IPC protocol package
- Window lifecycle
- Basic workbench layout
- CSP and Electron security settings

Validation:

- Desktop app launches
- Renderer has no Node access
- IPC rejects malformed payloads
- Basic Playwright/Electron smoke test

### Phase 2: Workspace and Filesystem

Goal: Open real projects and browse files safely.

Deliverables:

- Workspace service
- Filesystem service
- Path validation
- Project explorer
- File open/read flow
- File watching
- Security tests for traversal and symlinks

Validation:

- Open project
- List directories
- Read files
- Reject path escapes
- Handle missing/deleted files

### Phase 3: Editor

Goal: Edit real files with Monaco.

Deliverables:

- Monaco integration
- Tabs
- Dirty state
- Save flow
- Basic search
- Diagnostics display interface
- Editor settings foundation

Validation:

- Open and edit files
- Save through secure service
- Detect external changes
- Avoid overwriting dirty buffers silently

### Phase 4: Terminal and Process Service

Goal: Provide integrated terminals and policy-aware command execution.

Deliverables:

- `node-pty` terminal sessions
- Terminal panel
- Process service
- Command classification
- Session lifecycle
- Cancellation and cleanup

Validation:

- Create terminal
- Send input
- Resize
- Terminate
- Classify dangerous commands

### Phase 5: Git Service

Goal: Surface real Git state safely.

Deliverables:

- Repository detection
- Status view
- Diff view
- Stage/unstage
- Commit
- Branch list
- Pull/push with permission model

Validation:

- Git fixtures
- Status parsing tests
- Diff tests
- Destructive operation approval tests

### Phase 6: AI Provider Abstraction

Goal: Add provider-neutral AI chat foundation.

Deliverables:

- AI provider interface
- Provider registry
- OpenAI-compatible provider
- Local/Ollama-ready provider interface
- Streaming responses
- Cancellation
- Secret storage
- Chat UI

Validation:

- Fake provider tests
- Streaming tests
- Cancellation tests
- Secret redaction tests

### Phase 7: Project Intelligence and Context

Goal: Give AI controlled project awareness.

Deliverables:

- Project detectors
- Project profile
- Context collectors
- Token budgeting
- Git diff context
- Open file context
- Context preview UI

Validation:

- Detector fixtures
- Context priority tests
- Large file exclusion tests
- Token budgeting tests

### Phase 8: Tool Registry

Goal: Let AI request structured, permissioned tools.

Deliverables:

- Tool interface
- Tool registry
- Native filesystem tools
- Git tools
- Process/test tools
- Tool event logs
- Tool result schemas

Validation:

- Schema validation tests
- Permission enforcement tests
- Tool timeout tests
- Tool error tests

### Phase 9: Agent Runtime

Goal: Implement controlled AI task execution.

Deliverables:

- Agent state machine
- Planner
- Execution loop
- Observation handling
- Approval requests
- Cancellation
- Run limits
- Agent task UI

Validation:

- State transition tests
- Fake model tests
- Fake tool tests
- Approval flow tests
- Cancellation tests
- Failure recovery tests

### Phase 10: Security Hardening

Goal: Prove the boundaries work.

Deliverables:

- Security test suite
- IPC fuzz-style validation tests
- Path and symlink tests
- Command policy expansion
- Secret redaction tests
- Audit log review

Validation:

- All security tests pass
- Manual review of Electron security checklist
- Threat model documented

### Phase 11: Plugin and MCP Foundation

Goal: Add extensibility without bypassing core controls.

Deliverables:

- Plugin manifest schema
- Local plugin loader
- Tool contribution model
- MCP adapter prototype
- Permission-gated plugin capabilities

Validation:

- Plugin permission tests
- MCP tool adapter tests
- Malicious plugin fixture tests

### Phase 12: Advanced Integrations

Goal: Add optional professional workflow integrations.

Potential deliverables:

- Docker read-only tools
- Database read-only tools
- Browser automation tools
- Debugging architecture
- Remote workspace research
- Deployment architecture research

Validation:

- Integration-specific permission tests
- No direct bypass of tool registry

## 31. First Implementation Milestone Recommendation

After this architecture is accepted, the safest first implementation milestone is:

```text
Phase 0 + Phase 1
```

That milestone should create a runnable but minimal desktop shell with the correct security shape:

- `pnpm` monorepo
- Electron main/preload/renderer split
- React + TypeScript renderer
- Secure typed IPC
- Basic workbench frame
- Logging, errors, config, and protocol foundations
- Initial tests proving renderer isolation and IPC validation

Do not implement AI agents, terminal, Git, or filesystem editing before the secure Electron and protocol foundation exists.

## 32. Architectural Decision Summary

Initial decisions:

- Use Electron for the desktop app.
- Use React + TypeScript for the renderer.
- Use Monaco for the editor.
- Use `pnpm` workspaces for the monorepo.
- Use strict TypeScript across packages.
- Use typed IPC with runtime schema validation.
- Keep privileged services outside the renderer.
- Use Git CLI through a controlled service.
- Use `node-pty` for integrated terminals.
- Use provider-neutral AI abstractions.
- Use a first-class permission engine below the UI.
- Use structured, permissioned tools for all agent actions.
- Use local indexing first; defer vector database decisions.
- Treat MCP, Docker, database, browser automation, and plugins as future tool providers constrained by the same permission system.

## 33. Definition of Done for Architecture Phase

This architecture phase is complete when:

- Repository state has been analyzed.
- Package structure is defined.
- Electron architecture is defined.
- Frontend architecture is defined.
- AI provider and agent architecture are defined.
- Tool system is defined.
- Permission system is defined.
- Git integration is defined.
- Testing strategy is defined.
- Security boundaries are defined.
- Implementation roadmap is defined.
- No implementation code has been started.
