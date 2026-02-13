---
title: Folder Subtree
description: Retrieve a specific folder subtree.
---

# Folder Subtree

## Request

`GET /api/v1/folders/tree/:path`

Example path: `projects/2026`

## Example

```bash
curl http://localhost:3000/api/v1/folders/tree/projects%2F2026 \
  -H "X-Mino-Key: <API_KEY>"
```

This endpoint replaces older docs that referenced `POST /api/v1/folders`.
