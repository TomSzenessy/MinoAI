import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { WaitlistForm } from "@/components/waitlist-form";
import { FaqList, JsonLd } from "@/components/structured-data";
import type { FaqEntry } from "@/components/structured-data";
import { breadcrumbSchema, pageMetadata, webPageSchema } from "@/lib/seo";

const TITLE = "Self-hosted AI notes in plain Markdown";
const DESCRIPTION =
  "One container, an Obsidian-compatible folder of Markdown files and your own model key. Back it up with a copy, audit it with grep.";

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/self-hosted-notes",
});

const COMPOSE = `services:
  mino:
    image: ghcr.io/tomszenessy/mino-server:main
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    volumes:
      - mino-data:/data
    environment:
      - MINO_DATA_DIR=/data
      - MINO_CONNECTION_MODE=relay
      - MINO_RELAY_URL=https://relay.mino.ink

volumes:
  mino-data:`;

const FAQ: FaqEntry[] = [
  {
    question: "Do I need Docker to run Mino?",
    answer:
      "A container is the supported path and the one the docs walk through, because the server keeps a SQLite index next to the data volume. Running from source with Bun works too, but you maintain the runtime yourself.",
  },
  {
    question: "Does the server phone home?",
    answer:
      "In the default relay mode the server keeps an outbound connection to relay.mino.ink, so a client reaches it without a port being opened. That connection is encrypted and the notes stay in your vault. Open-port mode skips the relay and listens behind your own proxy and TLS.",
  },
  {
    question: "How do I back it up?",
    answer:
      "Copy the data volume. Notes are Markdown files and attachments inside it, with a rebuildable SQLite index alongside; there is no opaque database to dump and no export step to remember.",
  },
  {
    question: "What happens to my notes if Mino stops being developed?",
    answer:
      "Nothing. They are .md files in a folder you control, readable by any editor, clipper or script. That is the entire point of choosing Markdown over a proprietary document store.",
  },
];

export default function SelfHostedPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={[
          webPageSchema({
            path: "/self-hosted-notes",
            name: TITLE,
            description: DESCRIPTION,
          }),
          breadcrumbSchema([
            { name: "Mino", path: "/" },
            { name: "Self-hosted", path: "/self-hosted-notes" },
          ]),
        ]}
      />

      <section className="page-hero">
        <span className="section-label">SELF-HOSTED</span>
        <h1>
          Your notes, on <span className="gradient-text">your server</span>.
        </h1>
        <p className="lead">
          One container, one folder of Markdown files, your own model key. The
          server is the sync: open the same vault from any browser through the
          mino.ink relay or your own tunnel, without paying for a sync service
          or parking the folder in someone else&apos;s cloud.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/waitlist" className="button-primary px-7 py-3 text-base">
            Join the launch list
          </Link>
          <Link
            href="/docs/reference/docker-compose"
            className="button-secondary px-7 py-3 text-base"
          >
            Read the deployment docs
          </Link>
        </div>
        <div className="pill-row">
          <span className="pill">Docker / Portainer</span>
          <span className="pill">Plain .md files</span>
          <span className="pill">Relay tunnel</span>
          <span className="pill">No open port needed</span>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <div className="article">
          <h2>Plain files, with an index that rebuilds</h2>
          <p>
            The vault is a directory of Markdown files with YAML front matter,
            the same shape Obsidian uses, plus a SQLite index that exists purely
            to make search and link lookups fast. Delete the index and it
            rebuilds from the files; that asymmetry is deliberate. The files are
            the truth, the index is a convenience.
          </p>
          <p>
            This is what makes a self-hosted notes app worth running: you can
            audit it with <code>grep</code>, sync it with <code>rsync</code>,
            version it with Git, and hand it to any editor that reads Markdown.
            No migration tool required, because there is nothing proprietary to
            migrate away from.
          </p>

          <h2>Up in one stack</h2>
          <p>
            The reference deployment is a compose file. Paste it into Portainer
            or run it with <code>docker compose up -d</code>, and the server
            bootstraps itself: first start generates the server ID, the admin
            API key and the pairing links, printed in the container log.
          </p>
        </div>

        <pre className="code-block mt-6">{COMPOSE}</pre>

        <div className="article mt-10">
          <p>
            The port is bound to <code>127.0.0.1</code> on purpose. In the
            default relay mode you do not need to publish the server at all: it
            keeps an outbound connection to the relay, and clients reach it
            through a pairing code. If you would rather expose it directly,
            switch to open-port mode and point the bind at <code>0.0.0.0</code>{" "}
            behind your own reverse proxy and TLS.
          </p>

          <h2>The same API the UI uses</h2>
          <p>
            Every note operation the interface performs is available over the
            HTTP API with an <code>X-Mino-Key</code> header: search, read,
            create, move, tree. An MCP bridge in the repository exposes the same
            operations to MCP clients, so an external agent can work in the same
            vault without scraping the UI.
          </p>
          <p>
            The API is documented route by route, including the auth flow and
            the health endpoint, so wiring a script or a channel bot into it
            does not require reading the server source.
          </p>

          <h2>The honest cost of self-hosting</h2>
          <p>Running your own server is not free, and it is not zero-effort:</p>
          <ul>
            <li>
              You own updates, backups and disk space. The volume is small, but
              unattended servers rot.
            </li>
            <li>
              You need a model API key for the agent to do anything. Without
              one, Mino is a fast Markdown vault with search — which is still
              useful, just not the pitch.
            </li>
            <li>
              You are the sysadmin when something breaks. The docs and the relay
              exist to keep that boring, not to make it disappear.
            </li>
          </ul>
          <p>
            If that trade sounds wrong, the list is still there: one email when
            Mino launches, and you can decide then.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="cta-panel">
          <h2>Get one email when Mino launches</h2>
          <p>
            The compose file, the walkthrough and the code are public today. The
            list is a launch announcement, nothing else.
          </p>
          <div className="mx-auto max-w-xl">
            <WaitlistForm idPrefix="self-hosted" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-24">
        <h2 className="mb-10 text-center font-display text-3xl font-bold md:text-4xl">
          Self-hosting questions
        </h2>
        <FaqList items={FAQ} />
      </section>
    </MarketingShell>
  );
}
