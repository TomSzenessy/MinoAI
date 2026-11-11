# Launch-list confirmation email

<!-- index: design | Launch-list confirmation email — Mailspool copy and markup | Editing the signup email or its Mailspool transport. -->

The email a signup receives. It lives in Mailspool twice, because the form
auto-reply takes inline HTML rather than a template id:

- **Form auto-reply** — `PATCH /api/v1/forms/4` with `replySubject` + `replyBody`.
  This is what a signup actually gets.
- **Template** — "Launch list confirmation" (`templates/1`), used for test sends
  and the launch campaign.

Source of truth for the markup: [`launch-confirmation-email.html`](./launch-confirmation-email.html).
If you edit it, update both places.

## Design

- 600 px, table layout, inline styles — the only thing that survives Outlook.
- `#f5f5f7` canvas, white card at 22 px radius, `#1d1d1f` ink, `#424245` body,
  `#86868b` meta: the Apple mail palette in Mino's type.
- 34 px headline at `-0.022em`; three spec rows with hairline `#e8e8ed` dividers
  and uppercase micro-labels instead of a bullet list.
- One black pill CTA ("Run Mino today"); one quieter text link.
- 620 px breakpoint stacks the spec labels and the button; a
  `prefers-color-scheme: dark` block flips the card to `#1c1c1e`.
- Hidden preheader: "One email when Mino launches. Nothing in between."
- `{{email}}` in the lede, `{{unsubscribe_url}}` in the footer.

## Why the logo is a PNG

Gmail and Outlook strip inline `<svg>`, and most clients block data-URI images,
so the mark is `https://mino.ink/email/mino-mark.png` (160 px for a 34 px slot).
The vector source is published at `https://mino.ink/email/mino-logo.svg` for
clients that render SVG.
