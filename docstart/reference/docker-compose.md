# Docker Compose — Server (Portainer Copy Block)

[Back to DocStart](../README.md)

Copy everything inside the code block into Portainer -> Stacks -> Add stack.

```yaml
# =============================================================================
# Mino Server — Docker Compose (Portainer-friendly)
#
# Usage:
#   docker compose up -d
#
# Copy-paste this file into Portainer → Stacks → "Add Stack" → Paste YAML.
#
# Includes Watchtower by default for automatic GHCR image updates.
#
# In relay mode (default), the server connects outbound to the relay —
# no tunnel or open ports needed. Just set MINO_RELAY_URL.
# =============================================================================

services:
  # -------------------------------------------------------------------------
  # Mino Server — The core API + built-in web UI
  # -------------------------------------------------------------------------
  mino:
    image: ghcr.io/tomszenessy/mino-server:${MINO_IMAGE_TAG:-main}
    container_name: mino-server
    restart: unless-stopped
    labels:
      - "com.centurylinklabs.watchtower.enable=true"
      - "com.centurylinklabs.watchtower.scope=mino-server"
    ports:
      - "${MINO_PORT_BIND:-127.0.0.1}:${MINO_PORT:-3000}:3000"
    volumes:
      - mino-data:/data
    environment:
      - NODE_ENV=production
      - MINO_DATA_DIR=/data
      - MINO_CONNECTION_MODE=${MINO_CONNECTION_MODE:-relay}
      - MINO_RELAY_URL=${MINO_RELAY_URL:-https://relay.mino.ink}
      - MINO_PUBLIC_SERVER_URL=${MINO_PUBLIC_SERVER_URL:-}
      # Optional overrides (set in Portainer env vars):
      # - MINO_PORT=3000
      # - MINO_HOST=0.0.0.0
      # - MINO_AUTH_MODE=api-key
      # - MINO_CORS_ORIGINS=https://mino.ink,https://test.mino.ink
      # - MINO_AGENT_ENABLED=true
      # - MINO_AGENT_PROVIDER=anthropic
      # - MINO_AGENT_MODEL=claude-sonnet-4-20250514
      # - MINO_AGENT_API_KEY=sk-ant-...
      # - MINO_LOG_LEVEL=info
      # - MINO_LOCAL_DEV_UI_ORIGIN=http://localhost:5173
    healthcheck:
      test:
        [
          "CMD",
          "bun",
          "-e",
          "fetch('http://127.0.0.1:3000/api/v1/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))",
        ]
      interval: 30s
      timeout: 5s
      start_period: 10s
      retries: 3

  # -------------------------------------------------------------------------
  # Watchtower — Auto-update GHCR image and restart container on new digest
  # -------------------------------------------------------------------------
  watchtower:
    image: containrrr/watchtower:latest
    container_name: mino-watchtower
    restart: unless-stopped
    entrypoint: ["/bin/sh", "-ec"]
    command:
      - |
        if [ "${WATCHTOWER_POLL_INTERVAL:-300}" = "-1" ]; then
          echo "Watchtower disabled (WATCHTOWER_POLL_INTERVAL=-1)."
          exec tail -f /dev/null
        fi
        case "${WATCHTOWER_POLL_INTERVAL:-300}" in
          ''|*[!0-9]*)
            echo "Invalid WATCHTOWER_POLL_INTERVAL=${WATCHTOWER_POLL_INTERVAL:-300}. Falling back to 300."
            exec /watchtower --label-enable --scope mino-server --cleanup --interval "300"
            ;;
          *)
            exec /watchtower --label-enable --scope mino-server --cleanup --interval "${WATCHTOWER_POLL_INTERVAL:-300}"
            ;;
        esac
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_NO_STARTUP_MESSAGE=true
    depends_on:
      mino:
        condition: service_started

volumes:
  mino-data:
    name: mino-data
```

## Environment Variables

Set these in Portainer's "Environment variables" section:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MINO_CONNECTION_MODE` | No | `relay` | `relay` or `open-port` |
| `MINO_RELAY_URL` | Yes (relay mode) | `https://relay.mino.ink` | URL of the relay service |
| `MINO_IMAGE_TAG` | No | `main` | Docker image tag |
| `MINO_PORT` | No | `3000` | Server port |
| `MINO_LOCAL_DEV_UI_ORIGIN` | No | `http://localhost:5173` | Local web client origin used in generated quick-connect links |
| `WATCHTOWER_POLL_INTERVAL` | No | `300` | Seconds between update checks (`-1` disables checks) |

## Test Domain Example

```
MINO_CONNECTION_MODE=relay
MINO_RELAY_URL=https://relay.mino.ink
```
