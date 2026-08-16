# Development

## Setup

```bash
npm install
npm run dev
```

## Validation

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
```

## Desktop App

The desktop app lives in `apps/desktop` and uses `electron-vite`.

Main process code owns privileged services. Renderer code talks to those services only through preload APIs.
