import type { ServerConfig } from "@mino-ink/shared";
import { NoteService } from "./note-service";
import { FileManager } from "./file-manager";

export interface AgentToolAction {
  type: "search" | "read" | "create" | "move" | "tree";
  summary: string;
  path?: string;
}

export interface AgentChatInput {
  message: string;
  notePath?: string;
  channel?: "telegram" | "whatsapp" | "web";
}

export interface AgentChatResult {
  reply: string;
  actions: AgentToolAction[];
  relatedNotes: Array<{ path: string; title: string }>;
  model: string;
  provider: string;
  createdAt: string;
}

interface MoveIntent {
  fromPath: string;
  toPath: string;
}

function normalizeMessage(message: string): string {
  return message.replace(/\s+/g, " ").trim();
}

function inferSearchQuery(message: string): string | null {
  const quoted = message.match(/"([^"]{2,120})"/)?.[1];
  if (quoted) {
    return quoted.trim();
  }

  const words = message
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter((part) => part.length >= 4);

  if (words.length === 0) {
    return null;
  }

  return words.sort((a, b) => b.length - a.length)[0] ?? null;
}

function shouldCreateNote(message: string): boolean {
  return /\bcreate\b/i.test(message) && /\bnote\b/i.test(message);
}

function buildCreatedNotePath(message: string): string {
  const slug = message
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  const stem = slug.length > 0 ? slug : "agent-note";
  return `agent/${stem}.md`;
}

function buildCreatedNoteContent(title: string, sourceMessage: string): string {
  return [
    `# ${title}`,
    "",
    "Created by Mino Agent based on your request:",
    "",
    `> ${sourceMessage}`,
    "",
  ].join("\n");
}

function normalizePathCandidate(raw: string): string {
  return raw.trim().replace(/^["']|["']$/g, "");
}

function inferMoveIntent(message: string): MoveIntent | null {
  const explicitMove = message.match(
    /\b(?:move|rename)\b\s+(?:note\s+)?(["'A-Za-z0-9_./-]+\.md)\s+\b(?:to|into)\b\s+(["'A-Za-z0-9_./-]+(?:\.md)?)/i,
  );
  if (!explicitMove) {
    return null;
  }

  const sourcePath = normalizePathCandidate(explicitMove[1] ?? "");
  const targetRaw = normalizePathCandidate(explicitMove[2] ?? "");
  if (!sourcePath || !targetRaw) {
    return null;
  }

  if (targetRaw.toLowerCase().endsWith(".md")) {
    return {
      fromPath: sourcePath,
      toPath: targetRaw,
    };
  }

  const fileName = sourcePath.split("/").pop();
  if (!fileName) {
    return null;
  }

  return {
    fromPath: sourcePath,
    toPath: `${targetRaw.replace(/\/+$/, "")}/${fileName}`,
  };
}

function shouldShowTree(message: string): boolean {
  return /\b(tree|folder|folders|structure|list files|list notes|file tree)\b/i.test(
    message,
  );
}

export class AgentService {
  private readonly notes: NoteService;
  private readonly fileManager: FileManager;
  private readonly config: ServerConfig;

  constructor(dataDir: string, config: ServerConfig) {
    this.notes = new NoteService(dataDir);
    this.fileManager = new FileManager(dataDir);
    this.config = config;
  }

  async chat(input: AgentChatInput): Promise<AgentChatResult> {
    const message = normalizeMessage(input.message);
    if (!message) {
      throw new Error("Message is required.");
    }

    const actions: AgentToolAction[] = [];
    const relatedNotes: Array<{ path: string; title: string }> = [];
    const replySections: string[] = [];

    const moveIntent = inferMoveIntent(message);
    if (moveIntent) {
      const sourceExists = await this.notes.noteExists(moveIntent.fromPath);
      if (!sourceExists) {
        replySections.push(`I couldn't find ${moveIntent.fromPath} to move.`);
      } else {
        const destinationExists = await this.notes.noteExists(moveIntent.toPath);
        if (destinationExists) {
          replySections.push(
            `I can't move ${moveIntent.fromPath} because ${moveIntent.toPath} already exists.`,
          );
        } else {
          const moved = await this.notes.moveNote(moveIntent.fromPath, moveIntent.toPath);
          if (moved) {
            actions.push({
              type: "move",
              path: moved.path,
              summary: `Moved note from ${moveIntent.fromPath} to ${moveIntent.toPath}.`,
            });
            relatedNotes.unshift({ path: moved.path, title: moved.title });
            replySections.push(`I moved ${moveIntent.fromPath} to ${moveIntent.toPath}.`);
          }
        }
      }
    }

    const query = inferSearchQuery(message);
    if (query) {
      const results = await this.notes.searchNotes(query, { limit: 4 });
      for (const result of results) {
        relatedNotes.push({ path: result.path, title: result.title });
      }

      actions.push({
        type: "search",
        summary: `Searched notes for "${query}" and found ${results.length} matches.`,
      });

      if (results.length > 0) {
        replySections.push(
          `I found ${results.length} related note${results.length === 1 ? "" : "s"} for "${query}":`,
          ...results.map((result) => `- ${result.title} (${result.path})`),
        );
      } else {
        replySections.push(`I couldn't find notes for "${query}" yet.`);
      }
    }

    if (shouldShowTree(message)) {
      const tree = await this.fileManager.getTree();
      const rootEntries = tree.root.children ?? [];
      const preview = rootEntries
        .slice(0, 8)
        .map((entry) =>
          entry.isDirectory
            ? `- 📁 ${entry.path || entry.name}`
            : `- 📄 ${entry.path || entry.name}`,
        );

      actions.push({
        type: "tree",
        summary: `Loaded folder tree with ${rootEntries.length} top-level entries.`,
      });

      if (preview.length > 0) {
        replySections.push("Top-level files and folders:", ...preview);
      } else {
        replySections.push("Your file tree is currently empty.");
      }
    }

    if (input.notePath) {
      const note = await this.notes.getNote(input.notePath);
      if (note) {
        const preview = note.content.replace(/\s+/g, " ").slice(0, 220);
        actions.push({
          type: "read",
          path: input.notePath,
          summary: `Read note ${input.notePath} for context.`,
        });
        replySections.push(`Context from ${input.notePath}: ${preview}${preview.length >= 220 ? "..." : ""}`);
      }
    }

    if (shouldCreateNote(message)) {
      const notePath = buildCreatedNotePath(message);
      const title = message.slice(0, 80);
      const note = await this.notes.createNote(notePath, buildCreatedNoteContent(title, message));
      actions.push({
        type: "create",
        path: note.path,
        summary: `Created note ${note.path}.`,
      });
      relatedNotes.unshift({ path: note.path, title: note.title });
      replySections.push(`I created a new note at ${note.path}.`);
    }

    if (replySections.length === 0) {
      replySections.push(
        "I can search your notes, read specific files, and create draft notes. Ask me to search a topic or create a note.",
      );
    }

    return {
      reply: replySections.join("\n"),
      actions,
      relatedNotes,
      model: this.config.agent.model || "mino-agent-rules",
      provider: this.config.agent.provider || "local",
      createdAt: new Date().toISOString(),
    };
  }
}
