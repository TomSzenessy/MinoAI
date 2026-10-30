import type { FaqEntry } from "@/components/structured-data";

/**
 * FAQ copy shared by the landing page and /faq.
 *
 * The answers are the ones people actually search for ("mino ai", "mino app",
 * "mino login") and they stay honest about what is shipped today versus what
 * early access opens up.
 */

export const HOME_FAQ: FaqEntry[] = [
  {
    question: "What is Mino AI?",
    answer:
      "Mino is a Markdown notebook with an AI agent attached. Your notes stay as plain .md files, and the agent imports new material, tags it, links it to related notes and finds it again months later. It runs on a server you own instead of a vendor cloud.",
  },
  {
    question: "How is it different from a Markdown editor with a chat panel?",
    answer:
      "A chat panel answers questions about the note in front of you. Mino's agent works on the vault itself: it files what you drop in, keeps the links between notes coherent, and answers across everything you have written. The same API is exposed to outside agents over HTTP and MCP, so Cursor or Claude can read and write the vault directly.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "No. There is no central Mino account and no Mino cloud login. You deploy the server yourself with Docker or a Portainer stack, then link a client with a relay code or server URL. That is also why there is no 'mino login' page — there is no shared account to log into.",
  },
  {
    question: "What happens after I join the waitlist?",
    answer:
      "You get one email when a seat opens, containing the invite and the build links. There is no newsletter, and unsubscribing takes one click — every email carries the link.",
  },
  {
    question: "Is Mino free?",
    answer:
      "The core is open source and self-hostable at no cost: you supply the server and your own model API key. The AI agent stays disabled until you configure a provider, so nothing is metered by us and no note leaves your machine unless you point it at a model.",
  },
  {
    question: "Does it work offline and on mobile?",
    answer:
      "Yes, at different stages. The web client is local-first, and the mobile clients are built with Expo — Android and iOS builds are in internal testing and go out with early access. Sync runs over CRDTs, so edits made offline merge instead of overwriting each other.",
  },
];

export const FULL_FAQ: FaqEntry[] = [
  {
    question: "What is Mino AI?",
    answer:
      "Mino is an agent-native, Markdown-first notebook. Notes live as plain .md files on a server you run; an AI agent watches the vault, imports new material, tags it, links it to related notes and answers questions across everything you have written. It is open source, self-hostable, and has no central account.",
    link: { label: "See how the agent works", href: "/ai-notes" },
  },
  {
    question: "What does 'agent-native' actually mean?",
    answer:
      "It means the agent is part of the data model rather than a chat box bolted onto the side. Every note operation — search, read, create, move — is available over the same HTTP API the UI uses, and through an MCP bridge, so Cursor, Claude Desktop, or your own scripts can work with the same vault. The agent also runs on the server, so it can react to imported material when no browser is open.",
  },
  {
    question: "Do I have to bring my own AI key?",
    answer:
      "Today, yes: the agent is disabled until you configure a provider, model and API key, and search falls back to full-text until embeddings are configured. That is deliberate for a self-hosted tool — you decide which model sees your notes, and you pay that provider directly rather than a subscription to us.",
  },
  {
    question: "Where exactly are my notes stored?",
    answer:
      "As Markdown files inside the server's data directory, which is a Docker volume in the reference deployment. A SQLite index sits next to them for full-text search and links; it can be rebuilt from the files. Backing up Mino means backing up one folder, and leaving means copying that folder somewhere else.",
    link: { label: "Self-hosting details", href: "/self-hosted-notes" },
  },
  {
    question: "Can I import an existing Markdown vault?",
    answer:
      "Yes. Markdown with YAML front matter is the native format, so a vault exported from another tool drops in as-is, folders and all. Non-Markdown imports such as web pages, PDFs and voice memos go through the agent, which converts them to Markdown before filing them.",
  },
  {
    question: "Is there a Mino app for Android or iOS?",
    answer:
      "The clients exist and are built with Expo: the web workspace runs today, while the Android and iOS builds are in internal testing and are handed out with early access. Joining the waitlist is how you get the install link, rather than a public store listing with an unfinished app in it.",
  },
  {
    question: "How do I log in to Mino?",
    answer:
      "There is no Mino login page and no Mino account, by design. You open the workspace, link it to your own server with a relay code (when the server has no public port) or a server URL plus API key, and the credentials are stored in that browser. Nothing authenticates against mino.ink itself.",
  },
  {
    question: "How much will Mino cost?",
    answer:
      "The core is open source and free to self-host, and that will not change. Early access is free as well. If a hosted option ever ships, people on the waitlist hear the details first — and self-hosting stays available.",
  },
  {
    question: "Why is there a waitlist at all?",
    answer:
      "Mino is built by one person and opened in small batches so the first users get a working product and real support instead of a demo. The list is also an honest signal: if enough people want it, Mino becomes the main focus. If not, the repository stays public either way.",
  },
  {
    question: "Who is building Mino?",
    answer:
      "Mino is built in the open by Tom Szenessy. The source, the issue tracker and the deployment files are all public, and the docs cover the architecture rather than hiding it behind a marketing page.",
    link: {
      label: "Browse the repository",
      href: "https://github.com/TomSzenessy/MinoAI",
    },
  },
];
