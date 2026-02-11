# Frontend

[Back to docs](./README.md)

## Current Frontend Targets

- `https://mino.ink` (production client)
- `https://test.mino.ink` (test client)
- local prototype in this repo (`prototype/`)

## Client-To-Server Contract

Clients connect to a Mino server URL and use:
- setup endpoint: `GET /api/v1/system/setup`
- auth header: `X-Mino-Key`

## Local Development (Prototype)

```bash
cd prototype
python3 -m http.server 5173
```

Open `http://localhost:5173`.

## Local Server Integration

1. Run server on `http://localhost:3000`.
2. Get setup payload from `http://localhost:3000/api/v1/system/setup`.
3. Use `links.connect.localUi` or manually configure the client with:
   - `serverUrl`
   - `apiKey`
