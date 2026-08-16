# Contributing to FUSE.DEV

Thanks for helping build FUSE.DEV.

## Local Setup

```bash
npm install
npm run dev
```

Before opening a pull request:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
```

## Engineering Standards

- Keep privileged operations outside the renderer.
- Add tests for security-sensitive behavior.
- Do not introduce fake UI behavior.
- Do not commit secrets.
- Keep package boundaries clear.
- Prefer small, typed modules over large mixed-responsibility files.

## Commit Style

Use concise, imperative commit messages:

```text
feat: add workspace filesystem service
fix: reject path traversal in file reads
test: cover command classifier risk levels
```
