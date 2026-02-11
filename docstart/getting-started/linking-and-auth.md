# Linking And Auth

[Back to DocStart](../README.md)

## First-Run Setup Endpoint

Open:

`http://<SERVER_IP>:3000/api/v1/system/setup`

This endpoint returns:
- server identity (`serverId`)
- auth method details (`X-Mino-Key`)
- setup status (`setupComplete`)
- connection links for `test.mino.ink`, `mino.ink`, and local UI

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
- `testMinoInk`
- `minoInk`
- `localUi`

If query-prefill is unsupported by the client, manually enter:
- `serverUrl`
- `apiKey`

## Planned `/link` Auto-Linking (Required)

This is a required frontend implementation target:
- route: `/link`
- input: `serverUrl` + `apiKey` query params
- behavior: auto-verify key, call `/api/v1/auth/link`, persist session/server config, then redirect to workspace

Detailed spec:
- `../reference/link-handler-spec.md`

Until `/link` exists in the client, manual entry is the fallback.

## Mark Setup Complete

When your UI successfully links, call:

```bash
curl -X POST http://<SERVER_IP>:3000/api/v1/auth/link \
  -H "X-Mino-Key: <API_KEY>"
```

After this:
- `setupComplete=true`
- setup endpoint redacts the API key value

## API Key Rotation

Current version does not include a dedicated key rotation endpoint yet. If rotation is needed now, regenerate credentials by replacing `/data/credentials.json` and restarting.
