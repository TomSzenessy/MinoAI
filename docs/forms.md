# Forms

<!-- index: design | Modular forms: definitions, renderer, bot-protection tiers | Adding a form, changing fields, or hardening against bots. -->
<!-- covers: apps/web/lib/forms.ts apps/web/components/mino-form.tsx apps/web/app/complaints/** apps/web/tests/forms.test.ts -->

A form is data, not a page. `lib/forms.ts` holds definitions; `MinoForm` renders
any of them; submissions go to a Mailspool public form endpoint with the
project's **public** key. Nothing navigates to the mail provider — no hosted
`/f/{slug}` page, no third-party domain, no account.

## The model

```ts
export interface FormDefinition {
  id: string;                 // storage + DOM id
  slug: string;               // Mailspool form slug — the submit target
  fields: FormFieldDefinition[];
  protection: "standard" | "strict";
  submitLabel: string;
  successTitle: string;
  successBody: string;
  minFillMs?: number;         // local speed gate
  attributeSource?: boolean;  // attach utm → referrer → path
  remember?: boolean;         // localStorage receipt per form id
}
```

Field types: `text`, `email`, `longtext`, `select`, `number`, `integer`,
`boolean`, `date`. `required`, `placeholder`, `options`, `maxLength`,
`autoComplete`, `rows` and `hint` are part of the definition, so adding a field
is a data change, not a component change.

`COMPLAINT_FORM` is the worked example; `/complaints` renders it with three
lines of JSX.

## Adding a form

1. Create the form on the Mailspool instance (`POST /api/v1/forms`) with the
   field keys the site will send. Keys must match exactly.
2. Add a definition in `apps/web/lib/forms.ts` and register it in
   `FORM_DEFINITIONS`.
3. Render it: `<MinoForm definition={MY_FORM} idPrefix="my-form" />`.
4. Link it from somewhere internal. **Never** link to `/f/{slug}` on the
   Mailspool host: the promise is that the form lives on mino.ink.

The public key (`pk_live_…`) is safe to ship — it can only create submissions.
It is configured in `lib/config.ts` and overridable with
`NEXT_PUBLIC_MAILSPOOL_PUBLIC_KEY`.

## Bot protection, by tier

Every defence below the line is enforced by the Mailspool endpoint itself, not by
the browser. Client-side checks exist to fail fast and to protect the user's
time; they are not the gate.

| Tier | What runs | Where | Cost | Notes |
| --- | --- | --- | --- | --- |
| 0 | Nothing | — | free | A public form with no protection gets spam within days |
| 1 | **Honeypot** — hidden `company` input, silently absorbed | client + server | free | Blocks naive form-filling bots; zero friction; no false positives |
| 2 | **Timing** — `ms-ts` render stamp, submissions under 3 s refused | server (Mailspool) | free | A human filling a complaint never submits in 3 s; the site also checks `minFillMs` locally |
| 2 | **Disposable-domain blocklist** | client + server | free | `lib/forms.ts` ships ~35 providers (incl. subdomains); Mailspool refuses throwaways too |
| 2 | **Link-in-value and bot User-Agent gate** | server | free | A submission containing a URL or sent by `curl`/no UA is answered `created` and stored nowhere |
| 3 | **Per-IP rate limit** — 10 requests/minute | server | free | Stops a scripted loop; a human never notices |
| 3 | **Cloudflare WAF rate limit / managed challenge** on `/waitlist` and `/complaints` | edge | free tier | Survives a bot that reads this document; no code |
| 4 | **Cloudflare Turnstile** (managed challenge, invisible for most) | client + server | free | Needs a small proxy to verify the token, since Mailspool cannot |
| 5 | **Turnstile + strict WAF (Bot Fight Mode, country/ASN rules)** | edge | Workers paid for some rules | The "maximum" tier; expect false positives on VPN users |

### What ships in the repo today

Tiers 1–2 on the client (`components/mino-form.tsx`), with tiers 1–3 enforced by
the endpoint. Tests cover the honeypot, the speed gate, the blocklist and
payload shape (`tests/forms.test.ts`). Turnstile is designed below and not
shipped — a widget without server-side verification is theatre.

### Turning on Cloudflare Turnstile (tier 4)

Turnstile issues a token the browser must obtain from Cloudflare; only a server
that holds the secret can say whether it is real. Mailspool's public endpoint
does not accept one, so insert a proxy:

```ts
// functions/api/form-submit.ts — Cloudflare Pages Function
export const onRequestPost: PagesFunction<{ TURNSTILE_SECRET: string }> = async (ctx) => {
  const { token, ...payload } = await ctx.request.json();
  const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({
      secret: ctx.env.TURNSTILE_SECRET,
      response: token,
      remoteip: ctx.request.headers.get("CF-Connecting-IP") ?? "",
    }),
  });
  if (!(await verify.json()).success) {
    return Response.json({ ok: false, error: "Challenge failed." }, { status: 403 });
  }
  const upstream = await fetch(
    "https://mailspool.szenessy.com/api/public/forms/mino-complaints-and-problem-reports",
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) },
  );
  return Response.json(await upstream.json(), { status: upstream.status });
};
```

Then set `NEXT_PUBLIC_FORM_ENDPOINT=/api/form-submit` and
`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, and add
`challenges.cloudflare.com` to `script-src`/`frame-src` in `next.config.ts` and
`public/_headers`. The Pages Function only exists on Cloudflare Pages; a
self-hosted static copy falls back to the direct endpoint, so the widget must be
rendered only when `NEXT_PUBLIC_FORM_ENDPOINT` is set.

### Turning on the edge rules (tier 3/5, no code)

Cloudflare dashboard → **Security → WAF**:

1. **Rate limiting rule**: path in `/waitlist, /complaints`, 5 requests per
   minute per IP, action *Managed Challenge*, 10-minute timeout.
2. **Bot Fight Mode** on (free) or **Super Bot Fight Mode** (paid) with
   *Definitely automated → Block*.
3. Optional country/ASN challenge only if the spam actually comes from one
   place; blocking whole regions breaks real users.

## What is deliberately not done

- No CAPTCHA images. They cost conversions and are solved cheaply.
- No client-only "security". Anything that runs in the browser can be skipped.
- No email-address validation beyond syntax and the throwaway list; a
  confirmation email is the real proof that an address exists.
- No fingerprinting or third-party analytics on form pages.
