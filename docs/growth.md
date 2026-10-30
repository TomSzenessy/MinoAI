# Growth — launch list, search, and what to measure

> How the launch-list funnel works, why the site is shaped the way it is, and how
> to tell whether the organic traffic is worth the effort.

---

## 1. What the Search Console export said (last 3 months)

Source: `mino.ink-Performance-on-Search-2026-10-30.zip` (Google Search Console,
web search, 92 days).

| Metric | Value |
|---|---|
| Clicks | 113 |
| Impressions | 6 465 |
| CTR | 1.75 % |
| Average position | 16.3 |

Breakdown worth internalising:

- **Brand traffic is almost all of it.** `mino ai` alone is 1 818 impressions at
  position 6.2 — and only 3.74 % CTR. `mino` (1 650 impressions) sits at
  position 21.7 with a 0.24 % CTR, `mino app` (689) at 11.3 with 0.29 %.
  Together the three brand queries are ~64 % of all impressions.
- **Almost every click lands on the homepage** (108 of 113; 5 776 impressions,
  1.87 % CTR, position 14.6). `/workspace` and `/settings` pull 543 impressions
  between them with **zero** clicks — app pages ranking for brand queries are
  pure dilution.
- **Device split is 51 % desktop / 48 % mobile** with mobile CTR at half of
  desktop (1.29 % vs 2.21 %) — a mobile-unfriendly snippet or slow first paint
  shows up exactly like this.
- **Non-brand searches are noise-level.** No generic "AI notes" query clears a
  hundred impressions.

**The conclusion that drove this work:** the domain already wins the brand
query, but the page behind it converts none of that attention into anything
measurable. Two levers, in order: (1) capture the traffic into something
countable, (2) widen the surface beyond the brand term instead of optimising
the brand term harder.

---

## 2. The funnel that now exists

```
Google (brand + topical queries)
        │
        ▼
/  /waitlist  /ai-notes  /self-hosted-notes  /about  /faq
        │   hero form + mid-page band + end-of-article card
        ▼
Mailspool public form  ──►  submission + contact on list "Mino waitlist"
        │                          │
        │                          └─► notification email to the owner
        └─► confirmation email to the visitor (queued, not sent)
```

### Where the signups go

- **Form:** `mino-early-access-waitlist` (slug is historical; the list is the launch announcement) on the project's Mailspool instance
  (`https://mailspool.szenessy.com/f/mino-early-access-waitlist?key=…`).
- **Fields:** `email` (required), `first_name`, `use_case`, `source`.
  `source` is filled by the browser — `utm_source/utm_medium/utm_campaign`,
  else the referring host, plus the path the visitor signed up from.
- **List:** every verified submission is added to `Mino waitlist` (id 1,
  single opt-in, public).
- **Owner notification:** `notifyEmail` is set, so each submission emails the
  project owner with the field table and a deep link.
- **Unsubscribe:** every email carries one. Opt-outs win; nobody is
  re-subscribed by a later form fill.

### Reading attribution

`source` is the answer to "is the organic traffic worth it". After a few weeks,
group submissions by that column:

- `google/organic/…` → Search traffic that actually converted.
- `direct /ai-notes` → someone typed the URL or came from a client that strips
  referrers, but the page still did the work.
- A host like `news.ycombinator.com` → a real external mention.

If `google/organic` never appears, the SEO work is bringing readers, not
buyers — and the honest move is to spend the effort on distribution instead.

---

## 3. What changed on the site

### Conversion

- Waitlist form in the hero of `/`, in a mid-page band (`#waitlist`) and at the
  end of every marketing page; nav CTA points at it.
- `/waitlist` — dedicated launch-list page: what you get (one email), what you
  can do today, the roadmap, and signup FAQs.
- Success, duplicate and error states are all inline and localised (en/de/es);
  a returning visitor sees "you're on the list" instead of an empty form.
- Honeypot field (`company`) + no `ms-ts` stamp: bots are absorbed silently.

### Search

- **Titles and descriptions rewritten** around the real queries: "Mino AI",
  "mino app", "mino login", plus topical intent. The homepage default title is
  now `Mino AI — AI notes that organize themselves`.
- **New indexable pages:** `/ai-notes`, `/self-hosted-notes`, `/about`, `/faq`,
  `/waitlist` — each with unique long-form copy, a canonical URL and its own
  Open Graph card.
- **`/faq`** answers the navigational brand queries directly ("How do I log in
  to Mino?", "Is there a Mino app?", "How much does it cost?").
- **`/about`** is the entity page: a one-paragraph definition, a facts table and
  an explicit disambiguation from other products called Mino. This is the page
  written for answer engines, not for the reader who already knows the product.
- **Structured data:** `Organization`, `WebSite`, `SoftwareApplication`,
  `WebPage`, `BreadcrumbList`, `AboutPage` and `FAQPage`, with
  `disambiguatingDescription` on the entity nodes.
- **`/llms.txt`** lists the same facts in plain text for AI crawlers.
- **`robots.txt`** allows `GPTBot`, `OAI-SearchBot`, `PerplexityBot`,
  `ClaudeBot`, `Google-Extended`, `CCBot`, `Bingbot` and friends, and
  disallows `/workspace`, `/settings`, `/link` — the app surfaces that were
  wasting 543 impressions on zero clicks.
- **`sitemap.xml`** generated at build time, docs pages included automatically
  from `docs-site/`.
- **Docs pages get real titles and descriptions** (previously every one
  inherited the site title), so the 50-odd doc URLs can rank on their own.
- **Open Graph / Twitter image** rendered from the product screenshot, so a
  shared link is not a grey box.
- **Fonts self-hosted** (Inter, Space Grotesk, JetBrains Mono, latin +
  latin-ext, `woff2`): no third-party font request, no render-blocking
  stylesheet, and the cookie policy can honestly say nothing leaves the
  browser for a font CDN.

### Deliberately not done

- No fake ratings, review counts, prices or customer logos in structured data.
- No hreflang: the language switch is client-side, so all locales share one URL.
  Splitting `?lang=de` pages would create duplicate content, not translations.
- No comparison pages naming competitors. The `/about` disambiguation is
  factual and neutral; competitive pages need real, current product claims to
  be worth ranking.
- No analytics script. Signups are the metric, and Mailspool already stores
  the source.

---

## 4. Operating it

### Check performance

```bash
# recent submissions, newest first
curl -s -H "Authorization: Bearer $MAILSPOOL_KEY" \
  "https://mailspool.szenessy.com/api/v1/forms/4/submissions?limit=50"

# who is on the list
curl -s -H "Authorization: Bearer $MAILSPOOL_KEY" \
  "https://mailspool.szenessy.com/api/v1/lists/1/subscribers?status=confirmed"
```

The dashboard at `https://mailspool.szenessy.com` shows the same, with the CSV
export (`/api/v1/forms/4/export.csv`, capped at 500 rows).

### Change the form copy

Edit it in the dashboard, or `PATCH /api/v1/forms/4`. The site never hard-codes
the field list for the *hosted* page, but the inline React form does render a
fixed field set — if you add or rename a field, update
`apps/web/components/waitlist-form.tsx` and `buildWaitlistPayload` in
`apps/web/lib/waitlist.ts` to match.

### When the launch email goes out

Create a template and send to the list:

```bash
curl -s -X POST -H "Authorization: Bearer $MAILSPOOL_KEY" \
  -H "Content-Type: application/json" \
  https://mailspool.szenessy.com/api/v1/send \
  -d '{
    "listId": 1,
    "subject": "Your Mino invite is ready",
    "bodyHtml": "<p>Hi {{email}},</p><p>Mino is live. Here is what changed and how to run it.</p><p><a href=\"{{unsubscribe_url}}\">Unsubscribe</a></p>"
  }'
```

Preview the render first with `POST /api/v1/templates/preview`, and always keep
`{{unsubscribe_url}}` in bulk mail. `POST /send` returns `201` with a status —
that send is **queued** until `GET /sends/{id}` says `done`.

### Environment overrides

`NEXT_PUBLIC_MAILSPOOL_BASE_URL`, `NEXT_PUBLIC_MAILSPOOL_FORM_SLUG` and
`NEXT_PUBLIC_MAILSPOOL_PUBLIC_KEY` override the defaults in
`apps/web/lib/config.ts`. The public key is, by design, public: it can only
create submissions.

---

## 5. Thresholds (a suggestion, not a promise)

The point of the list is to answer the question that started this: is the
traffic worth it? A useful way to read the number once the pages have had a
month or two:

| Signups in 90 days | Reading |
|---|---|
| 0–10 | The traffic is brand curiosity, not demand. Keep the repo public; do not rebuild the roadmap around it. |
| 10–50 | Real but early. Talk to those people before deciding — the `use_case` field tells you who they are. |
| 50–150 | Enough to justify finishing the agent pipeline and the mobile builds. |
| 150+ | The waitlist is now the constraint: ship access faster than you add marketing. |

Track it against impressions, not clicks: if impressions double and signups
stay flat, the pages are attracting the wrong intent and the copy is the thing
to fix.
