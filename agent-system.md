# Agent System

The agent runtime is state-machine based and intentionally bounded.

States:

- `IDLE`
- `PLANNING`
- `WAITING_FOR_APPROVAL`
- `EXECUTING`
- `OBSERVING`
- `COMPLETED`
- `FAILED`
- `CANCELLED`
- `BLOCKED`

The runtime records events and exposes them to the UI. Tool execution is mediated by the tool registry and permission engine. AI-generated tool input is validated before execution.

Current implementation is a foundation: state transitions, event history, run limits, and registered tool abstractions. Full autonomous planning and reviewable code-edit loops are planned next.
