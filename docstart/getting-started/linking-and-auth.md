# Linking And Auth

[Back to DocStart](../README.md)

## First-Run Setup Endpoint

Open:

`http://<SERVER_IP>:3000/api/v1/system/setup`

This endpoint returns:
- server identity (`serverId`)
- auth method details (`X-Mino-Key`)
- setup status (`setupComplete`)
- connection mode + links (`relay` or `open-port`)

In relay mode, startup logs also print quick-connect links on every boot.

## Auth Method

Protected endpoints require:
- Header: `X-Mino-Key`
- Value: server admin API key

Example:

```bash
curl http://<SERVER_IP>:3000/api/v1/system/capabilities \
  -H "X-Mino-Key: <API_KEY>"
```

## Link Flows

From setup response (`links.connect`):
- Relay mode:
  - `testMinoInk`
  - `minoInk`
  - `localUi`
  - `localDevUi`
  - uses `relayCode` in link params
- Open-port mode:
  - `testMinoInk`
  - `minoInk`
  - `localUi`
  - `localDevUi`

If query-prefill is unsupported by the client, manually enter:
- `serverUrl`
- `apiKey`

## `/link` Auto-Linking (Implemented)

This flow is active in `apps/web`:
- route: `/link`
- input:
  - direct: `serverUrl` + `apiKey`
  - relay: `relayCode` (+ optional `relayUrl`)
- behavior: auto-verify key, call `/api/v1/auth/link`, persist session/server config, then redirect to workspace

Detailed spec:
- `../reference/link-handler-spec.md`

If params are missing or invalid, manual entry is the fallback.

## Mark Setup Complete

When your UI successfully links, call:

```bash
curl -X POST http://<SERVER_IP>:3000/api/v1/auth/link \
  -H "X-Mino-Key: <API_KEY>"
```

After this:
- `setupComplete=true`
- setup endpoint redacts the API key value
- startup logs still print relay quick-connect links and current relay pair code

## Relay Pair Code Rotation

If you want a new relay code, call:

```bash
curl -X POST http://<SERVER_IP>:3000/api/v1/auth/pair-code/rotate \
  -H "X-Mino-Key: <API_KEY>"
```

This returns:
- `relayPairCode`
- `relayPairCodeCreatedAt`

## API Key Rotation

Current version does not include a dedicated key rotation endpoint yet. If rotation is needed now, regenerate credentials by replacing `/data/credentials.json` and restarting.
