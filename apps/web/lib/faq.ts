import type { FaqEntry } from "@/components/structured-data";

/**
 * FAQ copy shared by the landing page, /faq and /waitlist.
 *
 * The questions are the ones people actually search for ("mino ai", "mino app",
 * "mino login", "mino note"). Answers stay under 60 words and say what is
 * runs today versus what is still in development.
 */

export const HOME_FAQ: FaqEntry[] = [
  {
    question: "What is Mino AI?",
    answer:
      "Mino is an open-source Obsidian alternative that runs on your own server. Your notes are plain .md files in a vault, and an AI agent files, tags, links and retrieves them. There is no Mino account.",
  },
  {
    question: "Can I run Mino today?",
    answer:
      "Yes. The repository is public: clone it, run the container with the compose file, and connect a client. The list is only a launch announcement, for people who would rather not run a server yet.",
  },
  {
    question: "How is it different from a Markdown editor with a chat panel?",
    answer:
      "A chat panel only knows the note you have open. Mino's agent works on the whole vault: it files what you save, keeps links between notes coherent, and answers across everything. The same operations are an HTTP API and an MCP bridge, so Cursor or Claude can read and write the vault.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "No. There is no Mino account and no central login. You deploy the server with Docker or a Portainer stack, then link a client with a relay code or a server URL plus API key. That is also why there is no 'mino login' page.",
  },
  {
    question: "What happens after I join the waitlist?",
    answer:
      "You get one email when Mino launches, and nothing else. No newsletter, no sequence. The confirmation you receive now carries a one-click unsubscribe if you change your mind.",
  },
  {
    question: "Is Mino free?",
    answer:
      "The core is open source and free to self-host. You supply the server and your own model API key, so you pay that provider directly. The agent stays disabled until you configure a provider, model and key; search works without one.",
  },
  {
    question: "Is there a mobile app?",
    answer:
      "The web workspace runs today from the repository. Android and iOS builds are in development and will wrap the same vault; the list is only a launch announcement.",
  },
];

export const FULL_FAQ: FaqEntry[] = [
  {
    question: "What is Mino AI?",
    answer:
      "Mino is an open-source Obsidian alternative: a self-hosted Markdown vault with an AI agent that files, tags, links and retrieves your notes. Obsidian or any editor can open the same folder. There is no central account.",
    link: { label: "See how the agent works", href: "/ai-notes" },
  },
  {
    question: "Is Mino an Obsidian alternative?",
    answer:
      "For the vault, yes. Mino reads a folder of Markdown files with YAML front matter, so an Obsidian vault opens as-is and stays readable in Obsidian. Plugin compatibility is in progress, not finished. Mino is an independent project, not affiliated with Obsidian.",
  },
  {
    question: "Can I run Mino today?",
    answer:
      "Yes. The repository is public: clone it, run the container with the compose file, and connect a client. The list is only a launch announcement, for people who would rather not run a server yet.",
  },
  {
    question: "How is the AI part of the app?",
    answer:
      "The agent runs on your server, inside the vault: it files imports, tags, links, summarises and retrieves. Every note operation is also an HTTP route and an MCP bridge, so the interface and the agent use the same API instead of a chat panel on the side.",
  },
  {
    question: "Do I have to bring my own AI key?",
    answer:
      "Yes. The agent is disabled until you configure a provider, model and API key, and search falls back to full text until embeddings are configured. That is deliberate for a self-hosted tool: you decide which model sees your notes and you pay that provider directly.",
  },
  {
    question: "Where exactly are my notes stored?",
    answer:
      "As Markdown files in an Obsidian-compatible vault inside the server's data directory, which is a Docker volume in the reference deployment. A SQLite index sits next to them for search and link lookups; it rebuilds from the files. Backing up Mino means copying one folder.",
    link: { label: "Self-hosting details", href: "/self-hosted-notes" },
  },
  {
    question: "Can I import an existing Markdown vault?",
    answer:
      "Yes. Markdown with YAML front matter is the native format, so an Obsidian vault or a vault from another tool drops in as-is, folders included. Web pages, PDFs and long emails go through the agent, which converts them to Markdown before filing.",
  },
  {
    question: "Does the mino.ink relay see my notes?",
    answer:
      "The relay forwards requests between your client and your server over an encrypted connection, and it does not store your notes. Open-port mode skips the relay behind your own proxy, and your own tunnel works too.",
  },
  {
    question: "Is there a Mino app for Android or iOS?",
    answer:
      "The web workspace runs today from the repository. Android and iOS builds are in development and will wrap the same vault; the list is only a launch announcement.",
  },
  {
    question: "What happens after I join the waitlist?",
    answer:
      "You get one email when Mino launches, and nothing else. No newsletter, no sequence. The confirmation you receive now carries a one-click unsubscribe if you change your mind.",
  },
  {
    question: "How do I log in to Mino?",
    answer:
      "There is no Mino login page and no Mino account. You open the workspace, link it to your own server with a relay code or a server URL plus API key, and the credentials stay in that browser. Nothing authenticates against mino.ink.",
  },
  {
    question: "Is Mino free?",
    answer:
      "The core is open source and free to self-host. You supply the server and your own model API key, so you pay that provider directly. The agent stays disabled until you configure a provider, model and key; search works without one.",
  },
  {
    question: "How much will Mino cost?",
    answer:
      "Mino is open source and free to self-host, and that will not change. You pay your model provider directly for the API key the agent uses. There is no subscription and no Mino account.",
  },
  {
    question: "Why is there a waitlist at all?",
    answer:
      "Because not everyone wants to run a server today. Mino is open source and on GitHub now; the list is for people who would rather hear when it launches. One email at launch, no newsletter.",
  },
  {
    question: "Who is building Mino?",
    answer:
      "Tom Szenessy builds Mino in the open. The source, the issue tracker and the deployment files are public, and the docs describe the architecture rather than hiding it behind a marketing page.",
    link: {
      label: "Browse the repository",
      href: "https://github.com/TomSzenessy/MinoAI",
    },
  },
];
