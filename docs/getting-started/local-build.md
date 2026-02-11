# Local Build And Interface

[Back to docs](../README.md)

## Prerequisites

- Bun `1.x`
- Docker (for image testing)
- Python 3 (optional, for serving prototype UI)

## Build And Run Server

```bash
bun install
cd packages/shared && bun run build
cd ../../apps/server && bun run dev
```

Server default URL:
- `http://localhost:3000`

## Test Suite

```bash
cd apps/server
bun test
```

## Build Docker Image Locally

```bash
docker build -f docker/Dockerfile -t mino-server .
docker run --rm -p 3000:3000 -v mino-data:/data mino-server
```

## Local Interface Options

### Option A: Hosted clients

Use:
- `https://test.mino.ink`
- `https://mino.ink`

### Option B: Prototype UI from this repo

```bash
cd prototype
python3 -m http.server 5173
```

Open:
- `http://localhost:5173`

## Local Linking

Use setup endpoint from your local server:
- `http://localhost:3000/api/v1/system/setup`

Then use the `links.connect.localUi` URL or manually pass:
- `serverUrl=http://localhost:3000`
- `apiKey=<YOUR_KEY>`
