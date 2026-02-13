/**
 * Agent Tools — Core tools for the Mino AI agent.
 *
 * These tools enable the AI agent to interact with the knowledge base:
 * - search: Full-text search across notes
 * - read: Read note content
 * - write: Create or update notes
 * - edit: Make targeted edits to notes
 * - move: Move or rename notes
 * - tree: Get folder structure
 * - tags: List and manage tags
 * - recent: Get recently modified notes
 *
 * Each tool follows a consistent pattern:
 * 1. Validate inputs
 * 2. Execute the operation
 * 3. Return structured results
 */

import { z } from "zod";
import type { NoteService } from "../services/note-service";
import type { FileManager } from "../services/file-manager";
import type { SearchResult, Note, FolderTree } from "@mino-ink/shared";

// ============================================================================
// Tool Types
// ============================================================================

/** Context provided to all tools. */
export interface ToolContext {
  noteService: NoteService;
  fileManager: FileManager;
  dataDir: string;
  userId?: string;
  conversationId?: string;
}

/** Result from a tool execution. */
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** Definition of an agent tool. */
export interface AgentTool<TInput = unknown, TOutput = unknown> {
  /** Tool name (unique identifier). */
  name: string;
  /** Tool description for the AI. */
  description: string;
  /** Input schema (Zod). */
  inputSchema: z.ZodType<TInput, z.ZodTypeDef, unknown>;
  /** Execute the tool. */
  execute: (input: TInput, context: ToolContext) => Promise<ToolResult<TOutput>>;
  /** Whether this tool modifies data. */
  destructive?: boolean;
  /** Whether this tool requires user confirmation. */
  requiresConfirmation?: boolean;
}

export type AnyAgentTool = AgentTool<any, any>;

// ============================================================================
// Search Tool
// ============================================================================

const SearchInputSchema = z.object({
  query: z.string().min(1).describe("The search query"),
  limit: z.number().min(1).max(100).optional().default(10),
  folder: z.string().optional().describe("Filter by folder path"),
});

type SearchInput = z.infer<typeof SearchInputSchema>;

export const searchTool: AgentTool<SearchInput, SearchResult[]> = {
  name: "mino_search",
  description: "Search for notes in the knowledge base using full-text search. Returns matching notes with snippets.",
  inputSchema: SearchInputSchema,
  execute: async (input, context) => {
    try {
      const results = await context.noteService.searchNotes(input.query, {
        limit: input.limit,
        folder: input.folder,
      });

      return {
        success: true,
        data: results,
        message: `Found ${results.length} note(s) matching "${input.query}"`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Search failed",
      };
    }
  },
};

// ============================================================================
// Read Tool
// ============================================================================

const ReadInputSchema = z.object({
  path: z.string().min(1).describe("The note path (e.g., 'Projects/Alpha/readme.md')"),
});

type ReadInput = z.infer<typeof ReadInputSchema>;

export const readTool: AgentTool<ReadInput, Note> = {
  name: "mino_read",
  description: "Read the content of a specific note by its path.",
  inputSchema: ReadInputSchema,
  execute: async (input, context) => {
    try {
      const note = await context.noteService.getNote(input.path);

      if (!note) {
        return {
          success: false,
          error: `Note not found: ${input.path}`,
        };
      }

      return {
        success: true,
        data: note,
        message: `Read note: ${note.title}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to read note",
      };
    }
  },
};

// ============================================================================
// Write Tool
// ============================================================================

const WriteInputSchema = z.object({
  path: z.string().min(1).describe("The note path"),
  content: z.string().describe("The markdown content"),
  createOnly: z.boolean().optional().default(false).describe("Fail if note exists"),
});

type WriteInput = z.infer<typeof WriteInputSchema>;

export const writeTool: AgentTool<WriteInput, Note> = {
  name: "mino_write",
  description: "Create or update a note at the specified path.",
  inputSchema: WriteInputSchema,
  destructive: true,
  requiresConfirmation: false,
  execute: async (input, context) => {
    try {
      // Check if note exists
      const exists = await context.noteService.noteExists(input.path);

      if (input.createOnly && exists) {
        return {
          success: false,
          error: `Note already exists: ${input.path}`,
        };
      }

      let note: Note;
      if (exists) {
        note = await context.noteService.updateNote(input.path, input.content);
      } else {
        note = await context.noteService.createNote(input.path, input.content);
      }

      return {
        success: true,
        data: note,
        message: exists ? `Updated note: ${note.title}` : `Created note: ${note.title}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to write note",
      };
    }
  },
};

// ============================================================================
// Edit Tool
// ============================================================================

const EditInputSchema = z.object({
  path: z.string().min(1).describe("The note path"),
  oldText: z.string().min(1).describe("Text to find and replace"),
  newText: z.string().describe("Replacement text"),
  replaceAll: z.boolean().optional().default(false).describe("Replace all occurrences"),
});

type EditInput = z.infer<typeof EditInputSchema>;

export const editTool: AgentTool<EditInput, Note> = {
  name: "mino_edit",
  description: "Edit a note by replacing specific text. Useful for targeted changes.",
  inputSchema: EditInputSchema,
  destructive: true,
  requiresConfirmation: false,
  execute: async (input, context) => {
    try {
      const note = await context.noteService.getNote(input.path);

      if (!note) {
        return {
          success: false,
          error: `Note not found: ${input.path}`,
        };
      }

      let newContent: string;
      if (input.replaceAll) {
        newContent = note.content.split(input.oldText).join(input.newText);
      } else {
        newContent = note.content.replace(input.oldText, input.newText);
      }

      if (newContent === note.content) {
        return {
          success: false,
          error: `Text not found: "${input.oldText.slice(0, 50)}..."`,
        };
      }

      const updated = await context.noteService.updateNote(input.path, newContent);

      return {
        success: true,
        data: updated,
        message: `Edited note: ${updated.title}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to edit note",
      };
    }
  },
};

// ============================================================================
// Delete Tool
// ============================================================================

const DeleteInputSchema = z.object({
  path: z.string().min(1).describe("The note path to delete"),
});

type DeleteInput = z.infer<typeof DeleteInputSchema>;

export const deleteTool: AgentTool<DeleteInput, void> = {
  name: "mino_delete",
  description: "Delete a note at the specified path.",
  inputSchema: DeleteInputSchema,
  destructive: true,
  requiresConfirmation: true,
  execute: async (input, context) => {
    try {
      const exists = await context.noteService.noteExists(input.path);

      if (!exists) {
        return {
          success: false,
          error: `Note not found: ${input.path}`,
        };
      }

      await context.noteService.deleteNote(input.path);

      return {
        success: true,
        message: `Deleted note: ${input.path}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete note",
      };
    }
  },
};

// ============================================================================
// Move Tool
// ============================================================================

const MoveInputSchema = z.object({
  fromPath: z.string().min(1).describe("Current note path"),
  toPath: z.string().min(1).describe("New note path"),
});

type MoveInput = z.infer<typeof MoveInputSchema>;

export const moveTool: AgentTool<MoveInput, Note> = {
  name: "mino_move",
  description: "Move or rename a note to a new path.",
  inputSchema: MoveInputSchema,
  destructive: true,
  requiresConfirmation: true,
  execute: async (input, context) => {
    try {
      const note = await context.noteService.moveNote(input.fromPath, input.toPath);

      if (!note) {
        return {
          success: false,
          error: `Failed to move note from ${input.fromPath} to ${input.toPath}`,
        };
      }

      return {
        success: true,
        data: note,
        message: `Moved note to: ${input.toPath}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to move note",
      };
    }
  },
};

// ============================================================================
// Tree Tool
// ============================================================================

const TreeInputSchema = z.object({
  folder: z.string().optional().describe("Folder path to get subtree (default: root)"),
});

type TreeInput = z.infer<typeof TreeInputSchema>;

export const treeTool: AgentTool<TreeInput, FolderTree> = {
  name: "mino_tree",
  description: "Get the folder tree structure of the knowledge base.",
  inputSchema: TreeInputSchema,
  execute: async (input, context) => {
    try {
      const tree = await context.fileManager.getTree(input.folder);

      return {
        success: true,
        data: tree,
        message: `Found ${tree.totalFiles} files`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get tree",
      };
    }
  },
};

// ============================================================================
// Tags Tool
// ============================================================================

const TagsInputSchema = z.object({});

type TagsInput = z.infer<typeof TagsInputSchema>;

export const tagsTool: AgentTool<TagsInput, string[]> = {
  name: "mino_tags",
  description: "List all unique tags used across notes.",
  inputSchema: TagsInputSchema,
  execute: async (_input, context) => {
    try {
      const tags = context.noteService.getAllTags();

      return {
        success: true,
        data: tags,
        message: `Found ${tags.length} unique tag(s)`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get tags",
      };
    }
  },
};

// ============================================================================
// Recent Tool
// ============================================================================

const RecentInputSchema = z.object({
  limit: z.number().min(1).max(50).optional().default(10),
});

type RecentInput = z.infer<typeof RecentInputSchema>;

export const recentTool: AgentTool<RecentInput, Note[]> = {
  name: "mino_recent",
  description: "Get recently modified notes.",
  inputSchema: RecentInputSchema,
  execute: async (input, context) => {
    try {
      const notes = await context.noteService.listNotes();

      // Sort by updatedAt descending
      const sorted = notes
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, input.limit);

      // Get full notes
      const fullNotes: Note[] = [];
      for (const meta of sorted) {
        const note = await context.noteService.getNote(meta.path);
        if (note) fullNotes.push(note);
      }

      return {
        success: true,
        data: fullNotes,
        message: `Found ${fullNotes.length} recent note(s)`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get recent notes",
      };
    }
  },
};

// ============================================================================
// Tool Registry
// ============================================================================

/** All available agent tools. */
export const agentTools: AnyAgentTool[] = [
  searchTool,
  readTool,
  writeTool,
  editTool,
  deleteTool,
  moveTool,
  treeTool,
  tagsTool,
  recentTool,
];

/** Get a tool by name. */
export function getTool(name: string): AnyAgentTool | undefined {
  return agentTools.find((t) => t.name === name);
}

/** Get all tool names. */
export function getToolNames(): string[] {
  return agentTools.map((t) => t.name);
}

/** Get tool descriptions for AI context. */
export function getToolDescriptions(): string {
  return agentTools
    .map((t) => `- ${t.name}: ${t.description}`)
    .join("\n");
}

/** Validate tool input against schema. */
export function validateToolInput<T>(
  tool: AgentTool<T>,
  input: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = tool.inputSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "),
  };
}
