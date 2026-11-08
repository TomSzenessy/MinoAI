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

## Cloudflare Email Service

Cloudflare sends transactional mail and offers three ways in. Which one works
depends on **where the sender runs**:

| Path | From a Cloudflare Worker | From anywhere else |
| --- | --- | --- |
| SMTP, `smtp.mx.cloudflare.net:465` | **Impossible** — see below | Works |
| REST API, `POST /accounts/{id}/email/sending/send` | Works | Works |
| Workers `send_email` binding | Works | Not applicable |

### Why SMTP cannot work from a Worker

Cloudflare's Workers runtime blocks outbound TCP to **Cloudflare IP ranges**,
and `smtp.mx.cloudflare.net` resolves into them:

```bash
dig +short smtp.mx.cloudflare.net      # 162.159.205.26 …
dig +short smtp.mx.cloudflare.net AAAA # 2606:4700:f5::14 …
```

The connection is closed before the SMTP greeting, which the runtime reports as
`Stream was cancelled`. No TLS option changes that — it is a network policy, not
a handshake bug. Mailspool therefore sends Cloudflare accounts over HTTPS.

### Configure it in Mailspool

Use the **REST** transport: host `cloudflare-rest`, the Cloudflare **account id**
as the username, and an API token with **Email Sending: Edit** as the password.

| Field | Value |
| --- | --- |
| name | Cloudflare Email Sending |
| host | `cloudflare-rest` |
| port | any (unused) |
| username | your Cloudflare account id |
| password | API token with Email Sending: Edit |
| from email | any address on an onboarded domain |

The account id is in the dashboard URL: `dash.cloudflare.com/<account_id>/…`.
"Test connection" verifies the token against `/user/tokens/verify`; "Test
message" performs a real send.

The REST path returns per-recipient status (`delivered`, `queued`,
`permanent_bounces`), and Mailspool maps Cloudflare's error codes
(`email.sending.error.authentication.forbidden`, `…not_entitled`) to the message
it shows.

### Prerequisites and DNS

Onboard the domain under **Compute → Email Service → Email Sending**. Cloudflare
then manages these records:

| Record | Name | Value |
| --- | --- | --- |
| MX | `cf-bounce` | Cloudflare bounce MX hosts |
| TXT (SPF) | `cf-bounce` | `v=spf1 include:_spf.mx.cloudflare.net ~all` |
| TXT (DKIM) | `cf-bounce._domainkey` | `v=DKIM1; h=sha256; k=rsa; p=…` |
| TXT (DMARC) | `_dmarc` | `v=DMARC1; p=none; rua=mailto:…` |

**The sending SPF is on `cf-bounce.mino.ink`, not on the root** — that is where
the envelope sender lives, and receivers evaluate SPF there. A checker that only
reads the root reports "No SPF record" for a correctly authenticated setup;
Mailspool reads the envelope name first and infers the `cf-bounce` DKIM selector.

Publishing a root SPF is optional, and only for third-party tools that insist on
reading the `From:` domain. Only one `v=spf1` record may exist per name; merge
includes if another provider already sends for the domain.

> **Do not stay on `p=reject` while verifying.** A single alignment miss is then
> refused outright and looks like "no email arrived". Use `p=none` until one real
> message passes SPF and DKIM, then tighten.

### One transport, many senders

Each sender is its own Mailspool account because `fromEmail` lives on the
account. **Duplicate** copies host, username, TLS settings and the stored
credentials, and asks only for the new name and address:

```bash
curl -s -X POST -H "Authorization: Bearer $MAILSPOOL_KEY" \
  -H "Content-Type: application/json" \
  https://mailspool.szenessy.com/api/v1/smtp/1/duplicate \
  -d '{"name":"Cloudflare — worldfolder","fromEmail":"hello@worldfolder.com"}'
```

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
