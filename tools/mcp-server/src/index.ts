/**
 * Mino MCP Server — Model Context Protocol implementation for Mino.
 *
 * This server exposes Mino's capabilities to AI agents via the
 * Model Context Protocol (MCP). It provides tools for:
 * - Note CRUD operations
 * - Full-text search
 * - Folder navigation
 * - Tag management
 *
 * @example
 * // Start the MCP server
 * npx @mino-ink/mcp-server
 *
 * // Or use programmatically
 * import { MinoMCPServer } from "@mino-ink/mcp-server";
 * const server = new MinoMCPServer({ serverUrl: "http://localhost:3000", apiKey: "mino_sk_..." });
 * await server.start();
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
	ListResourcesRequestSchema,
	ReadResourceRequestSchema,
	type Tool,
	type Resource
} from '@modelcontextprotocol/sdk/types.js';

// ============================================================================
// Types
// ============================================================================

/** Configuration for the MCP server. */
export interface MinoMCPConfig {
	/** Mino server URL (default: http://localhost:3000). */
	serverUrl?: string;
	/** API key for authentication. */
	apiKey: string;
	/** Server name for MCP identification. */
	name?: string;
	/** Server version. */
	version?: string;
}

/** Result from a tool execution. */
export interface ToolResult {
	content: Array<{
		type: 'text';
		text: string;
	}>;
	isError?: boolean;
}

// ============================================================================
// Tool Definitions
// ============================================================================

const MINO_TOOLS: Tool[] = [
	{
		name: 'mino_search',
		description:
			'Search for notes in the Mino knowledge base using full-text search. Returns matching notes with snippets.',
		inputSchema: {
			type: 'object',
			properties: {
				query: {
					type: 'string',
					description: 'The search query. Supports FTS5 syntax.'
				},
				limit: {
					type: 'number',
					description:
						'Maximum number of results (default: 10, max: 50).',
					default: 10
				},
				folder: {
					type: 'string',
					description: 'Optional folder path to limit search scope.'
				}
			},
			required: ['query']
		}
	},
	{
		name: 'mino_read',
		description: 'Read the content of a specific note by its path.',
		inputSchema: {
			type: 'object',
			properties: {
				path: {
					type: 'string',
					description:
						"The relative path to the note (e.g., 'Projects/Alpha/readme.md')."
				}
			},
			required: ['path']
		}
	},
	{
		name: 'mino_write',
		description: 'Create or update a note at the specified path.',
		inputSchema: {
			type: 'object',
			properties: {
				path: {
					type: 'string',
					description:
						"The relative path for the note (e.g., 'Projects/New/notes.md')."
				},
				content: {
					type: 'string',
					description: 'The markdown content to write.'
				},
				createOnly: {
					type: 'boolean',
					description: 'If true, fail if the note already exists.',
					default: false
				}
			},
			required: ['path', 'content']
		}
	},
	{
		name: 'mino_edit',
		description:
			'Edit a note by replacing specific text. Useful for making targeted changes.',
		inputSchema: {
			type: 'object',
			properties: {
				path: {
					type: 'string',
					description: 'The relative path to the note.'
				},
				oldText: {
					type: 'string',
					description: 'The text to find and replace.'
				},
				newText: {
					type: 'string',
					description: 'The replacement text.'
				}
			},
			required: ['path', 'oldText', 'newText']
		}
	},
	{
		name: 'mino_delete',
		description: 'Delete a note at the specified path.',
		inputSchema: {
			type: 'object',
			properties: {
				path: {
					type: 'string',
					description: 'The relative path to the note to delete.'
				}
			},
			required: ['path']
		}
	},
	{
		name: 'mino_move',
		description: 'Move or rename a note to a new path.',
		inputSchema: {
			type: 'object',
			properties: {
				fromPath: {
					type: 'string',
					description: 'The current path of the note.'
				},
				toPath: {
					type: 'string',
					description: 'The new path for the note.'
				}
			},
			required: ['fromPath', 'toPath']
		}
	},
	{
		name: 'mino_tree',
		description: 'Get the folder tree structure of the knowledge base.',
		inputSchema: {
			type: 'object',
			properties: {
				folder: {
					type: 'string',
					description:
						'Optional folder path to get subtree (default: root).'
				}
			}
		}
	},
	{
		name: 'mino_list_tags',
		description: 'List all unique tags used across notes.',
		inputSchema: {
			type: 'object',
			properties: {}
		}
	},
	{
		name: 'mino_list_notes',
		description: 'List all notes with their metadata.',
		inputSchema: {
			type: 'object',
			properties: {
				folder: {
					type: 'string',
					description: 'Optional folder to filter by.'
				},
				tag: {
					type: 'string',
					description: 'Optional tag to filter by.'
				}
			}
		}
	}
];

// ============================================================================
// API Client
// ============================================================================

class MinoAPIClient {
	private baseUrl: string;
	private apiKey: string;

	constructor(baseUrl: string, apiKey: string) {
		this.baseUrl = baseUrl.replace(/\/$/, '');
		this.apiKey = apiKey;
	}

	private async request<T>(
		path: string,
		options: { method?: string; body?: unknown } = {}
		): Promise<T> {
			const url = `${this.baseUrl}/api/v1${path}`;
			const response = await fetch(url, {
				method: options.method ?? 'GET',
				headers: {
					'Content-Type': 'application/json',
					'X-Mino-Key': this.apiKey
				},
				body: options.body ? JSON.stringify(options.body) : undefined
			});

		if (!response.ok) {
			const error = await response
				.json()
				.catch(() => ({ error: { message: response.statusText } }));
			throw new Error(error.error?.message ?? `HTTP ${response.status}`);
		}

		return response.json();
	}

	async search(
		query: string,
		options: { limit?: number; folder?: string } = {}
	) {
		const params = new URLSearchParams({ q: query });
		if (options.limit) params.set('limit', String(options.limit));
		if (options.folder) params.set('folder', options.folder);
		return this.request<{
			success: boolean;
			data: Array<{
				path: string;
				title: string;
				snippet: string;
				score: number;
				tags: string[];
			}>;
		}>(`/search?${params}`);
	}

	async getNote(path: string) {
		return this.request<{
			success: boolean;
			data: {
				path: string;
				title: string;
				content: string;
				tags: string[];
				links: string[];
				backlinks: string[];
			};
		}>(`/notes/${encodeURIComponent(path)}`);
	}

	async createNote(path: string, content: string) {
		return this.request<{ success: boolean; data: unknown }>(`/notes`, {
			method: 'POST',
			body: { path, content }
		});
	}

	async updateNote(path: string, content: string) {
		return this.request<{ success: boolean; data: unknown }>(
			`/notes/${encodeURIComponent(path)}`,
			{
				method: 'PUT',
				body: { content }
			}
		);
	}

	async deleteNote(path: string) {
		return this.request(`/notes/${encodeURIComponent(path)}`, {
			method: 'DELETE'
		});
	}

	async moveNote(fromPath: string, toPath: string) {
		return this.request<{ success: boolean; data: unknown }>(
			`/notes/${encodeURIComponent(fromPath)}/move`,
			{
				method: 'PATCH',
				body: { path: toPath }
			}
		);
	}

	async getTree(folder?: string) {
		const params = folder ? `?folder=${encodeURIComponent(folder)}` : '';
		return this.request<{
			success: boolean;
			data: { root: unknown; totalFiles: number };
		}>(`/tree${params}`);
	}

	async listNotes() {
		return this.request<{
			success: boolean;
			data: Array<{ path: string; title: string; tags: string[] }>;
		}>('/notes');
	}
}

// ============================================================================
// MCP Server Implementation
// ============================================================================

export class MinoMCPServer {
	private server: Server;
	private api: MinoAPIClient;
	private config: Required<MinoMCPConfig>;

	constructor(config: MinoMCPConfig) {
		this.config = {
			serverUrl: config.serverUrl ?? 'http://localhost:3000',
			apiKey: config.apiKey,
			name: config.name ?? 'mino-mcp',
			version: config.version ?? '1.0.0'
		};

		this.api = new MinoAPIClient(this.config.serverUrl, this.config.apiKey);

		this.server = new Server(
			{ name: this.config.name, version: this.config.version },
			{ capabilities: { tools: {}, resources: {} } }
		);

		this.setupHandlers();
	}

	private setupHandlers(): void {
		// List tools
		this.server.setRequestHandler(ListToolsRequestSchema, async () => {
			return { tools: MINO_TOOLS };
		});

		// Handle tool calls
		this.server.setRequestHandler(
			CallToolRequestSchema,
			async (request) => {
				const { name, arguments: args } = request.params;

				try {
					const result = await this.executeTool(name, args ?? {});
					return result;
				} catch (error) {
					return {
						content: [
							{
								type: 'text',
								text: `Error: ${error instanceof Error ? error.message : String(error)}`
							}
						],
						isError: true
					};
				}
			}
		);

		// List resources
		this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
			try {
				const notes = await this.api.listNotes();
				const resources: Resource[] = notes.data.map((note) => ({
					uri: `mino://note/${note.path}`,
					name: note.title,
					description: `Note at ${note.path}`,
					mimeType: 'text/markdown'
				}));

				return { resources };
			} catch {
				return { resources: [] };
			}
		});

		// Read resource
		this.server.setRequestHandler(
			ReadResourceRequestSchema,
			async (request) => {
				const uri = request.params.uri;
				const match = uri.match(/^mino:\/\/note\/(.+)$/);

				if (!match) {
					throw new Error(`Invalid resource URI: ${uri}`);
				}

				const path = decodeURIComponent(match[1]!);
				const note = await this.api.getNote(path);

				return {
					contents: [
						{
							uri,
							mimeType: 'text/markdown',
							text: note.data.content
						}
					]
				};
			}
		);
	}

	private async executeTool(
		name: string,
		args: Record<string, unknown>
	): Promise<ToolResult> {
		switch (name) {
			case 'mino_search': {
				const { query, limit, folder } = args as {
					query: string;
					limit?: number;
					folder?: string;
				};
				const result = await this.api.search(query, { limit, folder });
				const text = result.data
					.map(
						(r) =>
							`## ${r.title}\nPath: ${r.path}\nScore: ${r.score.toFixed(2)}\n\n${r.snippet}\n`
					)
					.join('\n---\n\n');
				return {
					content: [
						{ type: 'text', text: text || 'No results found.' }
					]
				};
			}

			case 'mino_read': {
				const { path } = args as { path: string };
				const result = await this.api.getNote(path);
				return {
					content: [
						{
							type: 'text',
							text: `# ${result.data.title}\n\nPath: ${result.data.path}\nTags: ${result.data.tags.join(', ') || 'none'}\nBacklinks: ${result.data.backlinks.length}\n\n---\n\n${result.data.content}`
						}
					]
				};
			}

			case 'mino_write': {
				const { path, content, createOnly } = args as {
					path: string;
					content: string;
					createOnly?: boolean;
				};
				if (createOnly) {
					await this.api.createNote(path, content);
				} else {
					try {
						await this.api.updateNote(path, content);
					} catch {
						await this.api.createNote(path, content);
					}
				}
				return {
					content: [{ type: 'text', text: `Note written to ${path}` }]
				};
			}

			case 'mino_edit': {
				const { path, oldText, newText } = args as {
					path: string;
					oldText: string;
					newText: string;
				};
				const note = await this.api.getNote(path);
				const newContent = note.data.content.replace(oldText, newText);

				if (newContent === note.data.content) {
					return {
						content: [
							{
								type: 'text',
								text: `No changes made. Text not found: "${oldText}"`
							}
						]
					};
				}

				await this.api.updateNote(path, newContent);
				return {
					content: [
						{
							type: 'text',
							text: `Note ${path} updated successfully.`
						}
					]
				};
			}

			case 'mino_delete': {
				const { path } = args as { path: string };
				await this.api.deleteNote(path);
				return {
					content: [{ type: 'text', text: `Note ${path} deleted.` }]
				};
			}

			case 'mino_move': {
				const { fromPath, toPath } = args as {
					fromPath: string;
					toPath: string;
				};
				await this.api.moveNote(fromPath, toPath);
				return {
					content: [
						{
							type: 'text',
							text: `Note moved from ${fromPath} to ${toPath}.`
						}
					]
				};
			}

			case 'mino_tree': {
				const { folder } = args as { folder?: string };
				const result = await this.api.getTree(folder);
				const text = JSON.stringify(result.data, null, 2);
				return { content: [{ type: 'text', text }] };
			}

			case 'mino_list_tags': {
				// This would need a dedicated endpoint; for now, derive from notes
				const notes = await this.api.listNotes();
				const tags = new Set<string>();
				for (const note of notes.data) {
					for (const tag of note.tags) {
						tags.add(tag);
					}
				}
				return {
					content: [
						{
							type: 'text',
							text:
								Array.from(tags).sort().join('\n') ||
								'No tags found.'
						}
					]
				};
			}

			case 'mino_list_notes': {
				const notes = await this.api.listNotes();
				const text = notes.data
					.map((n) => `- ${n.title} (${n.path})`)
					.join('\n');
				return {
					content: [{ type: 'text', text: text || 'No notes found.' }]
				};
			}

			default:
				throw new Error(`Unknown tool: ${name}`);
		}
	}

	/** Starts the MCP server using stdio transport. */
	async start(): Promise<void> {
		const transport = new StdioServerTransport();
		await this.server.connect(transport);
		console.error(
			`Mino MCP Server started (${this.config.name} v${this.config.version})`
		);
	}
}

// ============================================================================
// CLI Entry Point
// ============================================================================

export async function main(): Promise<void> {
	const serverUrl = process.env.MINO_SERVER_URL ?? 'http://localhost:3000';
	const apiKey = process.env.MINO_API_KEY;

	if (!apiKey) {
		console.error('Error: MINO_API_KEY environment variable is required.');
		console.error('Set it to your Mino API key (mino_sk_...).');
		process.exit(1);
	}

	const server = new MinoMCPServer({
		serverUrl,
		apiKey,
		name: 'mino-mcp',
		version: '1.0.0'
	});

	await server.start();
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((error) => {
		console.error('Fatal error:', error);
		process.exit(1);
	});
}

export default MinoMCPServer;
