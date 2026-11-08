# Email assets

`mino-mark.png` is the brand mark rendered at 160×160 for a 34 px logo in HTML
email. It is a PNG on purpose: Gmail and Outlook strip inline SVG and many
clients block data-URI images, so the mark has to be a hosted raster to survive.

`mino-logo.svg` is the same mark as vector source — used by the site and by
anything that can render SVG (Apple Mail, iOS Mail, Thunderbird).

The launch-list confirmation email that uses these lives in Mailspool as
template `1` ("Launch list confirmation") and as the form's auto-reply.
