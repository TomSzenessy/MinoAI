import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { WaitlistForm } from "@/components/waitlist-form";
import { FaqList, JsonLd } from "@/components/structured-data";
import type { FaqEntry } from "@/components/structured-data";
import { breadcrumbSchema, pageMetadata, webPageSchema } from "@/lib/seo";

const TITLE = "AI agent for your Obsidian vault, self-hosted";
const DESCRIPTION =
  "An Obsidian alternative with an AI agent inside the vault: it imports, tags, links and summarises your Markdown notes. Self-hosted, your own model key.";

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/ai-notes",
});

const CAPABILITIES = [
  {
    title: "Import that ends in Markdown",
    body: "Drop in a web page, a PDF or a long email. The agent converts it to Markdown, pulls out a title and files it in the vault instead of an inbox you never open again.",
  },
  {
    title: "Filing, tags and links",
    body: "New material is matched against what you already have: tags get reused instead of reinvented, related notes get linked, and the folder tree stays shallow on purpose.",
  },
  {
    title: "Retrieval across the vault",
    body: "Full-text search works with no setup; embeddings make it semantic once you configure a provider. Ask a question and the answer arrives with the notes it came from.",
  },
];

const FAQ: FaqEntry[] = [
  {
    question: "Is the AI included, or do I bring a key?",
    answer:
      "You bring the key. The agent stays disabled until you configure a provider, model and API key on your server, so you choose which model sees your notes and you pay that provider directly.",
  },
  {
    question: "Does it work with an existing Markdown vault?",
    answer:
      "Yes, including an Obsidian vault. Markdown with YAML front matter is the native format, so it drops in as-is, folders included. The SQLite index is rebuilt from the files, not the other way round.",
  },
  {
    question: "Can my own agent use it?",
    answer:
      "Yes. Every note operation is exposed over the same HTTP API the UI uses, with an X-Mino-Key header, and an MCP bridge exposes it to clients like Cursor or Claude. An outside agent can search, read, create and move notes in the vault.",
  },
  {
    question: "Will it reorganize my notes without asking?",
    answer:
      "It proposes structure first: where a note should file, which notes it should link. Every action is reported in the conversation rather than applied silently. The vault stays editable by hand, because it is only files.",
  },
];

export default function AiNotesPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={[
          webPageSchema({
            path: "/ai-notes",
            name: TITLE,
            description: DESCRIPTION,
          }),
          breadcrumbSchema([
            { name: "Mino", path: "/" },
            { name: "AI notes", path: "/ai-notes" },
          ]),
        ]}
      />

      <section className="page-hero">
        <span className="section-label">AI NOTE-TAKING</span>
        <h1>
          The note gets filed{" "}
          <span className="gradient-text">before you do</span>.
        </h1>
        <p className="lead">
          Mino is an Obsidian alternative with the AI built into the app, not a
          panel added later. It runs on your server, works inside your Markdown
          vault, and does the filing you keep postponing: imports, tags, links,
          summaries and retrieval.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/waitlist" className="button-primary px-7 py-3 text-base">
            Join the launch list
          </Link>
          <Link
            href="/self-hosted-notes"
            className="button-secondary px-7 py-3 text-base"
          >
            How self-hosting works
          </Link>
        </div>
        <div className="pill-row">
          <span className="pill">Markdown files</span>
          <span className="pill">Bring your own model</span>
          <span className="pill">MCP + HTTP API</span>
          <span className="pill">Open source</span>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <div className="article">
          <h2>Capture is solved. Filing is not.</h2>
          <p>
            Capture got solved years ago. A share sheet, a web clipper, a voice
            memo: getting something <em>into</em> the notes app takes a second
            and works. What nobody solved is the day after, when the tenth
            unsorted capture lands next to the other nine.
          </p>
          <p>
            A folder tree asks you to make a classification decision at the
            worst possible moment, before you know what the note is for. A
            search box helps only if you remember the word you used six months
            ago. So the notes pile up, and the pile slowly becomes a graveyard.
          </p>
          <p>
            Mino inverts the order: capture first, decide later. The agent does
            the filing, and you correct it when it gets something wrong.
          </p>

          <h2>What the agent actually does</h2>
          <p>
            Nothing happens off your server. Three operations run on your
            files:
          </p>
        </div>

        <div className="card-grid mt-8">
          {CAPABILITIES.map((item) => (
            <article key={item.title} className="info-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>

        <div className="article mt-14">
          <h2>Why the agent is not a chat panel</h2>
          <p>
            A chat panel bolted onto an editor only knows the note you have
            open. Mino exposes the vault itself over the same HTTP API the UI
            uses, plus an MCP bridge. Point Cursor at it and the agent there can
            search your notes; point a cron job at it and a nightly run can file
            whatever landed in the inbox folder.
          </p>
          <p>
            Because the notes are plain Markdown, the agent is never the only
            way in. <code>grep</code>, <code>sed</code>, a Git remote, or an
            editor you already like — all of it still works on the same files.
          </p>

          <h2>What it will not do</h2>
          <ul>
            <li>
              It will not leave an answer unattributed. Retrieval runs over your
              vault, and the reply links the notes it used.
            </li>
            <li>
              It will not hide your data behind an export button. The vault is a
              directory of files you can copy, back up or leave with.
            </li>
            <li>
              It will not run without your say-so. The agent is off until you
              configure a provider and key, and embeddings are optional.
            </li>
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="cta-panel">
          <h2>Get one email when Mino launches</h2>
          <p>
            One email at launch, nothing else. If you would rather not wait, the
            repository and the docs are public today.
          </p>
          <div className="mx-auto max-w-xl">
            <WaitlistForm idPrefix="ai-notes" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-24">
        <h2 className="mb-10 text-center font-display text-3xl font-bold md:text-4xl">
          Questions about the agent
        </h2>
        <FaqList items={FAQ} />
      </section>
    </MarketingShell>
  );
}
