# Mailspool form copy — Mino launch list

<!-- index: design | Mailspool form copy — Mino launch list | Working on mailspool form copy — mino launch list. -->

Exact strings for the public form on Mailspool
(`https://mailspool.szenessy.com`, form `mino-early-access-waitlist`, id `4`).
The form slug is historical; the copy below never calls it early access.

The list has one purpose: tell people when Mino launches. Mino is already open
source and runnable from GitHub, so nothing here should imply gated access. The
confirmation email answers four things: what the list is for, what happens next
(one email at launch), what they can do now (run it), and how to leave.

## Payload to PATCH

`PATCH /api/v1/forms/4` with this body (all eight keys in one request):

```json
{
  "title": "Join the Mino launch list",
  "description": "Mino is an open-source Obsidian alternative you can run today. Join the list for one email when Mino launches, and nothing else.",
  "submitLabel": "Join the waitlist",
  "successMessage": "You are on the list. You will get one email when Mino launches, and nothing else.",
  "replySubject": "You're on the list for Mino's launch",
  "replyBody": "<p>You're on the list. Mino is open source and on GitHub now, so you can run it today. This list is for people who would rather hear when it launches, and this email confirms that <strong>{{email}}</strong> is on it.</p>\n<p><strong>What happens next.</strong> One email when Mino launches. No newsletter, no sequence, and no other messages from this list.</p>\n<p><strong>Meanwhile.</strong> The repository is at <a href=\"https://github.com/TomSzenessy/MinoAI\">github.com/TomSzenessy/MinoAI</a> and the docs at <a href=\"https://mino.ink/docs\">mino.ink/docs</a>: clone it, run the container with the compose file, connect a client.</p>\n<p>That is the whole list: this confirmation and the launch email. If you would rather not wait for it, <a href=\"{{unsubscribe_url}}\">unsubscribe here</a> and you are removed immediately.</p>\n<p>— Tom Szenessy, mino.ink</p>",
  "notifySubject": "New Mino launch-list signup",
  "notifyBody": "<p>New signup on the Mino launch list at {{datetime}}.</p>\n<div>{{fields_table}}</div>\n<p><a href=\"{{submission_url}}\">Open the submission in Mailspool</a></p>\n<p><code>source</code> shows the page and referrer, <code>use_case</code> shows who they are. Both are worth reading before launch.</p>"
}
```

Lengths, for reference: title 25 characters, description 128, submit label 17,
success message 155 (this one is a form success panel, not a meta description).

## Form fields

| Key | Type | Required | Notes |
| --- | --- | --- | --- |
| `email` | email | yes | The only field on the inline form's first row. |
| `first_name` | text | no | Optional on the site, max 80 characters. |
| `use_case` | select | no | Optional. Options below. |
| `source` | hidden | no | Filled by the browser: UTM triplet, else the referring host, plus the path. Never a URL. |

`use_case` options, in this order (these are the five the site can render):

1. `Personal knowledge base`
2. `Research & writing`
3. `Engineering docs & ADRs`
4. `AI agent workflows`
5. `Just curious`

**Decision to review:** I dropped `Team knowledge base`. The inline React form
renders exactly five options from `USE_CASE_KEYS` in
`apps/web/components/waitlist-form.tsx`, backed by `waitlist.useCases.*` in the
three message files. Adding a sixth value needs a new key (`waitlist.useCases.team`)
in all three JSON files plus an entry in `USE_CASE_KEYS`; until then, a sixth
Mailspool option would only exist on the no-JavaScript fallback, which makes
`use_case` harder to compare. The five labels are otherwise unchanged, so the
two forms match value for value.

## What the visitor gets, and why each line is there

- **This confirmation** is sent immediately and says what it is. The old copy
  implied a gate that does not exist, which is why it is gone.
- **One email at launch** is the only promise, and the email says "nothing
  else" to make it credible.
- **Run it today** points at the repository and the docs, because the list is
  not the only way in and should not pretend to be.
- **How to leave**: one link, `{{unsubscribe_url}}`, described in plain words.
- **`{{first_name}}` is deliberately unused.** The field is optional, and a
  template that opens with "Hi ," is worse than a neutral greeting. If Mailspool
  later supports a default value, `Hi {{first_name | there}},` is the one place
  to add it.
- **Owner email** carries `{{fields_table}}`, `{{datetime}}` and
  `{{submission_url}}`, so a signup is one click from the dashboard.

## Known inconsistency, not fixed here

The inline form submits the *localized* select label as `use_case`: a German
visitor stores `Persönliche Wissensbasis`, an English one stores `Personal
knowledge base`. The hosted Mailspool form stores its English option values.
Grouping signups by `use_case` therefore needs the three label sets (see
`waitlist.useCases.*` in `apps/web/messages/{en,de,es}.json`). Fixing it properly
means sending a stable key instead of the label, which is a code change in
`buildWaitlistPayload` and outside this copy pass.
