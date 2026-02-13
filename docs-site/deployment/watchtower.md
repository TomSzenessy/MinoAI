---
title: Watchtower
description: Automatic container updates for server and relay.
---

# Watchtower Auto-Updates

Watchtower is included in the recommended Portainer compose blocks.

## How It Is Configured

- Update only labeled containers
- Optional monitor-only mode
- Poll interval controlled by env var

## Key Variables

- `WATCHTOWER_POLL_INTERVAL` (default `300` seconds)
- `WATCHTOWER_MONITOR_ONLY` (`false` by default)

## Recommended Label Scope

- server stack scope: `mino-server`
- relay stack scope: `mino-relay`

## Manual Check

```bash
docker compose logs watchtower
```

## Disable Auto-Restarts

Set:

`WATCHTOWER_MONITOR_ONLY=true`

This keeps update visibility without restarting containers automatically.
