# Mino Docs

This documentation is organized for two audiences:
- users deploying from Portainer with copy/paste compose
- contributors building and extending Mino locally

## Getting Started

### 1. Deployment
- `getting-started/portainer-stack.md`
  What to paste into Portainer, what starts by default, and optional profiles.

### 2. Linking + Auth
- `getting-started/linking-and-auth.md`
  How `/api/v1/system/setup` works, what headers to use, and how linking is marked complete.

### 3. Local Build + Interface
- `getting-started/local-build.md`
  Build/test instructions and local interface options.

### 4. Troubleshooting
- `getting-started/troubleshooting.md`
  Common setup failures and fixes.

## Reference

### 1. Stack YAML
- `reference/docker-compose.md`
  Portainer-ready compose YAML copy block.

### 2. Setup API Payload
- `reference/setup-response.md`
  Field-by-field explanation of `GET /api/v1/system/setup`.

## Architecture Deep Dives

- `architecture.md`
- `server.md`
- `frontend.md`
- `ai-agent.md`
- `security.md`
- `design-system.md`
- `roadmap.md`

## Suggested Read Order

1. `getting-started/portainer-stack.md`
2. `getting-started/linking-and-auth.md`
3. `getting-started/troubleshooting.md`
4. Deep dives as needed
