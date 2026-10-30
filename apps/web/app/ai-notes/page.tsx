import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { WaitlistForm } from "@/components/waitlist-form";
import { FaqList, JsonLd } from "@/components/structured-data";
import type { FaqEntry } from "@/components/structured-data";
import { breadcrumbSchema, pageMetadata, webPageSchema } from "@/lib/seo";

const TITLE = "AI note-taking that files the note for you";
const DESCRIPTION =
  "Most AI note apps give you a chat box. Mino's agent works on the vault: it imports, tags, links and retrieves your Markdown notes — self-hosted, with your own model key. Join the early access list.";

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/ai-notes",
});

const CAPABILITIES = [
  {
    title: "Import that ends in Markdown",
    body: "Drop in a web page, a PDF or a long email. The agent converts it to Markdown, pulls out a title, and writes it into the vault where it belongs instead of dumping it in an inbox you will never open again.",
  },
  {
    title: "Filing, tagging and links",
    body: "New material is matched against what you already have: tags get reused rather than re-invented, related notes get linked, and the folder tree stays shallow on purpose.",
  },
  {
    title: "Retrieval across the vault",
    body: "Full-text search works out of the box; embeddings make it semantic when you configure a provider. Ask a question and the agent answers from your notes, with the source notes attached.",
  },
];

const FAQ: FaqEntry[] = [
  {
    question: "Is the AI included, or do I bring a key?",
    answer:
      "You bring the key. The agent stays disabled until you configure a provider, model and API key on your own server, which means you choose who sees your notes and you pay that provider directly.",
  },
  {
    question: "Does it work with an existing Markdown vault?",
    answer:
      "Yes. Markdown with YAML front matter is the native format, so a vault from another tool drops in as-is, folders and all. The SQLite index is rebuilt from the files rather than the other way round.",
  },
  {
    question: "Can my own agent use it?",
    answer:
      "That is the point of agent-native. Every note operation is available over the same HTTP API the UI uses, and an MCP bridge exposes it to clients like Cursor or Claude Desktop, so an outside agent can search, read, create and move notes in the same vault.",
  },
  {
    question: "Will it reorganize my notes without asking?",
    answer:
      "The agent proposes structure first — where a note should file, which notes it should link — and every action it takes is reported in the conversation instead of being silently applied. The vault stays editable by hand at any time, because it is just files.",
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
          Every notes app got good at capture and stayed bad at filing. Mino
          treats organization as the agent&apos;s job: it reads what you drop
          in, gives it a place, links it to what it already knows, and finds it
          again two years later.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/waitlist" className="button-primary px-7 py-3 text-base">
            Join the early access list
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
          <h2>The pile is the problem</h2>
          <p>
            Capture got solved years ago. A share sheet, a web clipper, a voice
            memo: getting something <em>into</em> the notes app takes a second
            and works. What nobody solved is the day after, when the tenth
            unsorted capture lands next to the other nine.
          </p>
          <p>
            A folder tree asks you to make a classification decision at the
            worst possible moment — before you know what the note is for. A
            search box helps only if you remember the word you used six months
            ago. So the notes pile up, and the pile slowly becomes a graveyard.
          </p>
          <p>
            Mino inverts the order: capture first, decide never. The agent does
            the filing, and you correct it when it gets something wrong.
          </p>

          <h2>What the agent actually does</h2>
          <p>
            There is no magic here, and no hidden model doing something you
            cannot inspect. Three operations run on the server, on your files:
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
          <h2>Agent-native, not chatbot-native</h2>
          <p>
            A chat panel bolted onto an editor only knows the note you have
            open. Mino exposes the vault itself over the same API the UI uses,
            plus an MCP bridge. Point Cursor at it and the agent there can
            search your notes; point a cron job at it and a nightly run can file
            whatever accumulated in your inbox folder.
          </p>
          <p>
            Because the notes are plain Markdown, the agent is never the only
            way in. <code>grep</code>, <code>sed</code>, a Git remote, or an
            editor you already like — all of it still works on the same files.
          </p>

          <h2>What it will not do</h2>
          <ul>
            <li>
              It will not invent facts to fill an answer. Retrieval is grounded
              in your notes, and the notes it used are linked in the reply.
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
          <h2>Get an invite when the next batch opens</h2>
          <p>
            One email, no newsletter. You can self-host from the repo today;
            early access adds the guided setup and the mobile builds.
          </p>
          <div className="mx-auto max-w-xl">
            <WaitlistForm idPrefix="ai-notes" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-24">
        <h2 className="mb-10 text-center font-display text-3xl font-bold md:text-4xl">
          AI notes, answered
        </h2>
        <FaqList items={FAQ} />
      </section>
    </MarketingShell>
  );
}
