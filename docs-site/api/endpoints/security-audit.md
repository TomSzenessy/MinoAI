---
title: Security Audit
description: Run and inspect security checks.
---

# Security Audit

## Request

`GET /api/v1/security/audit`

Header:

`X-Mino-Key: <API_KEY>`

## Example

```bash
curl http://localhost:3000/api/v1/security/audit \
  -H "X-Mino-Key: <API_KEY>"
```

## Related Endpoints

- `GET /api/v1/security/config`
- `GET /api/v1/security/recommendations`

## Response Highlights

- overall `score` (0-100)
- list of findings by severity
- summary counts (`critical`, `high`, `medium`, `low`, `info`)
