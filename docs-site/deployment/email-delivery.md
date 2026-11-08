---
title: Email delivery
description: Connect a sending account so the launch list, notifications and form replies actually leave the server — including the Cloudflare Email Service SMTP path.
---

# Email delivery

Mino's marketing site and forms are backed by a Mailspool instance. Mailspool
stores every submission even when it cannot send, which is why a form can look
successful while nothing arrives in an inbox:

```bash
curl -s -H "Authorization: Bearer $MAILSPOOL_KEY" \
  https://mailspool.szenessy.com/api/v1/stats
# {"ok":true,"stats":{"contacts":3,...,"sends":{"form:failed":8}}}
```

`form:failed` means the project has no working SMTP account. Prove it in one
call — this route sends a single rendered message and returns the transport
error verbatim:

```bash
curl -s -X POST -H "Authorization: Bearer $MAILSPOOL_KEY" \
  -H "Content-Type: application/json" \
  https://mailspool.szenessy.com/api/v1/send/test \
  -d '{"to":"you@example.com","subject":"Delivery test","bodyHtml":"<p>test</p>"}'
# {"ok":false,"error":"This project has no SMTP account to send from"}
```

Add one SMTP account to the project and every form email starts working:
owner notifications, auto-replies, automations and campaigns all use it.

## Cloudflare Email Service over SMTP

Cloudflare's Email Service (Beta) sends transactional mail and also accepts
authenticated SMTP submission, so an existing mail client or platform like
Mailspool can send through it. It requires the **Workers Paid** plan and at
least one domain onboarded for Email Sending.

Source: [Cloudflare Email Service — SMTP](https://developers.cloudflare.com/email-service/api/send-emails/smtp/).

### 1. Onboard the domain

Cloudflare dashboard → **Email Service → Email Sending** → onboard `mino.ink`.

Because the zone's DNS is already on Cloudflare, the SPF, DKIM and DMARC
records are added for you. Verify the domain before sending; an unverified
`MAIL FROM` domain is refused with `550 5.7.1`.

Any address on an onboarded domain may be the sender — `hello@mino.ink`,
`notifications@mino.ink`, whatever you use. There is no per-address allowlist to
sync: onboarding a second domain is what adds its addresses.

### 2. Mint an API token

Cloudflare dashboard → **My Profile → API Tokens → Create Token**, with a single
permission: **Account → Email Sending → Edit**.

Use an account-owned token. The token is the SMTP password, and anyone holding
it can send from every onboarded domain on that account.

### 3. Add the SMTP account to Mailspool

In the Mailspool dashboard: **Project → SMTP → Add account**, or the API:

```bash
curl -s -X POST -H "Authorization: Bearer $MAILSPOOL_KEY" \
  -H "Content-Type: application/json" \
  https://mailspool.szenessy.com/api/v1/smtp \
  -d '{
    "name": "Cloudflare Email Service",
    "host": "smtp.mx.cloudflare.net",
    "port": 465,
    "secure": true,
    "username": "api_token",
    "password": "<cloudflare api token>",
    "fromEmail": "hello@mino.ink",
    "fromName": "Mino",
    "isDefault": true,
    "maxPerMinute": 30
  }'
```

| Field | Value |
| --- | --- |
| host | `smtp.mx.cloudflare.net` |
| port | `465` |
| secure | `true` (implicit TLS — port 587 and STARTTLS are **not** supported) |
| username | `api_token` (the literal string) |
| password | the Cloudflare API token |
| fromEmail | any address on the onboarded domain |

Then confirm delivery:

```bash
curl -s -X POST -H "Authorization: Bearer $MAILSPOOL_KEY" \
  -H "Content-Type: application/json" \
  https://mailspool.szenessy.com/api/v1/send/test \
  -d '{"to":"you@example.com","subject":"Delivery test","bodyHtml":"<p>it works</p>"}'
```

`{"ok":true}` means the message was accepted by the transport. It is **queued**,
not delivered: check the inbox, then `GET /api/v1/sends/{id}` if you need the
report.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `535 5.7.8` | Username is not `api_token`, the token lacks **Email Sending: Edit**, or the token was revoked |
| `550 5.7.1` | `fromEmail` is on a domain that is not onboarded for Email Sending |
| Connection refused / timeout on `587` | Cloudflare only serves implicit TLS on `465` |
| `{"error":"This project has no SMTP account to send from"}` | No account yet, or the account was deleted while a send was pinned to it |

## Receiving mail

Sending and receiving are separate products. To get `hello@mino.ink` or
`complaints@mino.ink` into your own inbox, use **Cloudflare Email Routing**
(free): create the address, choose a destination, and Cloudflare adds the MX
records. That is also the cheapest way to offer a complaints address that lands
somewhere a human reads — though the complaint form already does that without a
mailbox, because Mailspool stores the submission and shows it in the dashboard.

## Quotas

Cloudflare applies account-wide daily sending limits and a 50-recipient cap per
SMTP session; Mailspool walks a campaign in chunks, so leave `maxPerMinute` at a
sane value (30 is comfortable for a launch announcement). A suppressed recipient
is rejected by Cloudflare unless **Drop suppressed recipients** is on, so keep
Mailspool's own suppression list as the source of truth for opt-outs.
