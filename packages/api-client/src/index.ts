/**
 * @mino-ink/api-client — TypeScript SDK for the Mino API.
 *
 * A fully-typed client for interacting with Mino servers.
 * Works in both Node.js and browser environments.
 *
 * @example
 * ```typescript
 * import { MinoClient } from "@mino-ink/api-client";
 *
 * const client = new MinoClient({
 *   serverUrl: "http://localhost:3000",
 *   apiKey: "mino_sk_...",
 * });
 *
 * // List notes
 * const notes = await client.notes.list();
 *
 * // Search
 * const results = await client.search("project alpha");
 *
 * // Create a note
 * const note = await client.notes.create("Projects/New/notes.md", "# New Note\n\nContent here");
 * ```
 */

import type {
	Note,
	NoteMetadata,
	FolderTree,
	SearchResult,
	Credentials,
	ServerIdentity,
	SystemCapabilities,
	HealthStatus
} from '@mino-ink/shared';

// ============================================================================
// Types
// ============================================================================

/** Configuration for the Mino client. */
export interface MinoClientConfig {
	/** Server URL (e.g., http://localhost:3000). */
	serverUrl: string;
	/** API key for authentication. */
	apiKey: string;
	/** Request timeout in milliseconds (default: 30000). */
	timeout?: number;
	/** Custom fetch function (for testing or custom environments). */
	fetch?: typeof fetch;
}

/** API error response. */
export interface MinoApiError {
	success: false;
	error: {
		code: string;
		message: string;
		details?: unknown;
	};
}

/** Options for search queries. */
export interface SearchOptions {
	/** Maximum number of results (default: 20, max: 100). */
	limit?: number;
	/** Filter by folder path. */
	folder?: string;
	/** Filter by tags. */
	tags?: string[];
}

/** Options for listing notes. */
export interface ListNotesOptions {
	/** Filter by folder path. */
	folder?: string;
}

/** Agent chat options. */
export interface AgentChatOptions {
	/** Conversation ID for context continuity. */
	conversationId?: string;
}

/** Agent chat response. */
export interface AgentChatResponse {
	reply: string;
	actions: Array<{
		type: 'search' | 'read' | 'create' | 'move' | 'tree';
		summary: string;
		path?: string;
	}>;
	relatedNotes: Array<{
		path: string;
		title: string;
	}>;
	model: string;
	provider: string;
	createdAt: string;
}

/** Plugin manifest. */
export interface PluginManifest {
	id: string;
	name: string;
	version: string;
	description?: string;
	author?: string;
	enabled: boolean;
	installed: boolean;
}

/** Channel configuration. */
export interface ChannelConfig {
	id: string;
	provider: 'telegram' | 'whatsapp';
	name?: string;
	enabled: boolean;
	createdAt: string;
}

// ============================================================================
// Error Class
// ============================================================================

/** Error thrown by the Mino API. */
export class MinoError extends Error {
	/** Error code from the API. */
	readonly code: string;
	/** HTTP status code. */
	readonly status: number;
	/** Additional error details. */
	readonly details?: unknown;

	constructor(
		code: string,
		message: string,
		status: number,
		details?: unknown
	) {
		super(message);
		this.name = 'MinoError';
		this.code = code;
		this.status = status;
		this.details = details;
	}
}

// ============================================================================
// HTTP Client
// ============================================================================

class HttpClient {
	private baseUrl: string;
	private apiKey: string;
	private timeout: number;
	private fetchFn: typeof fetch;

	constructor(config: MinoClientConfig) {
		this.baseUrl = config.serverUrl.replace(/\/$/, '');
		this.apiKey = config.apiKey;
		this.timeout = config.timeout ?? 30000;
		this.fetchFn = config.fetch ?? fetch;
	}

	async request<T>(
		method: string,
		path: string,
		options: {
			body?: unknown;
			params?: Record<string, string | number | undefined>;
		} = {}
	): Promise<T> {
		const url = new URL(`${this.baseUrl}/api/v1${path}`);

		// Add query parameters
		if (options.params) {
			for (const [key, value] of Object.entries(options.params)) {
				if (value !== undefined) {
					url.searchParams.set(key, String(value));
				}
			}
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeout);

		try {
			const response = await this.fetchFn(url.toString(), {
				method,
				headers: {
					'Content-Type': 'application/json',
					'X-Mino-Key': this.apiKey
				},
				body: options.body ? JSON.stringify(options.body) : undefined,
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			// Handle empty responses
			const text = await response.text();
			const data = text ? JSON.parse(text) : null;

			if (!response.ok) {
				const error = data as MinoApiError;
				throw new MinoError(
					error?.error?.code ?? 'UNKNOWN_ERROR',
					error?.error?.message ?? response.statusText,
					response.status,
					error?.error?.details
				);
			}

			return data as T;
		} catch (error) {
			clearTimeout(timeoutId);

			if (error instanceof MinoError) {
				throw error;
			}

			if (error instanceof Error && error.name === 'AbortError') {
				throw new MinoError('TIMEOUT', 'Request timed out', 0);
			}

			throw new MinoError(
				'NETWORK_ERROR',
				error instanceof Error ? error.message : 'Network error',
				0
			);
		}
	}

	get<T>(
		path: string,
		params?: Record<string, string | number | undefined>
	): Promise<T> {
		return this.request<T>('GET', path, { params });
	}

	post<T>(path: string, body?: unknown): Promise<T> {
		return this.request<T>('POST', path, { body });
	}

	put<T>(path: string, body: unknown): Promise<T> {
		return this.request<T>('PUT', path, { body });
	}

	patch<T>(path: string, body: unknown): Promise<T> {
		return this.request<T>('PATCH', path, { body });
	}

	delete<T>(path: string): Promise<T> {
		return this.request<T>('DELETE', path);
	}
}

function envVar(name: string): string | undefined {
	const maybeProcess = (
		globalThis as { process?: { env?: Record<string, string | undefined> } }
	).process;
	return maybeProcess?.env?.[name];
}

// ============================================================================
// API Modules
// ============================================================================

/** Notes API module. */
class NotesAPI {
	constructor(private http: HttpClient) {}

	/** List all notes with metadata. */
	async list(options?: ListNotesOptions): Promise<NoteMetadata[]> {
		const response = await this.http.get<{
			success: boolean;
			data: NoteMetadata[];
		}>('/notes', options?.folder ? { folder: options.folder } : undefined);
		return response.data;
	}

	/** Get a single note by path. */
	async get(path: string): Promise<Note> {
		const response = await this.http.get<{ success: boolean; data: Note }>(
			`/notes/${encodeURIComponent(path)}`
		);
		return response.data;
	}

	/** Create a new note. */
	async create(path: string, content: string): Promise<Note> {
		const response = await this.http.post<{ success: boolean; data: Note }>(
			'/notes',
			{
				path,
				content
			}
		);
		return response.data;
	}

	/** Update an existing note. */
	async update(path: string, content: string): Promise<Note> {
		const response = await this.http.put<{ success: boolean; data: Note }>(
			`/notes/${encodeURIComponent(path)}`,
			{ content }
		);
		return response.data;
	}

	/** Delete a note. */
	async delete(path: string): Promise<void> {
		await this.http.delete(`/notes/${encodeURIComponent(path)}`);
	}

	/** Move a note to a new path. */
	async move(fromPath: string, toPath: string): Promise<Note> {
		const response = await this.http.patch<{
			success: boolean;
			data: Note;
		}>(`/notes/${encodeURIComponent(fromPath)}/move`, { path: toPath });
		return response.data;
	}

	/** Check if a note exists. */
	async exists(path: string): Promise<boolean> {
		try {
			await this.get(path);
			return true;
		} catch (error) {
			if (error instanceof MinoError && error.code === 'NOTE_NOT_FOUND') {
				return false;
			}
			throw error;
		}
	}
}

/** Folders API module. */
class FoldersAPI {
	constructor(private http: HttpClient) {}

	/** Get the folder tree structure. */
	async tree(folder?: string): Promise<FolderTree> {
		const normalizedFolder = folder?.trim().replace(/^\/+|\/+$/g, '');
		const endpoint = normalizedFolder
			? `/folders/tree/${encodeURIComponent(normalizedFolder)}`
			: '/folders/tree';
		const response = await this.http.get<{
			success: boolean;
			data: FolderTree;
		}>(endpoint);
		return response.data;
	}

	/** Create a new folder. */
	async create(path: string): Promise<void> {
		await this.http.post('/folders', { path });
	}

	/** Delete a folder. */
	async delete(path: string): Promise<void> {
		await this.http.delete(`/folders/${encodeURIComponent(path)}`);
	}
}

/** Search API module. */
class SearchAPI {
	constructor(private http: HttpClient) {}

	/** Search notes using full-text search. */
	async search(
		query: string,
		options?: SearchOptions
	): Promise<SearchResult[]> {
		const response = await this.http.get<{
			success: boolean;
			data: SearchResult[];
		}>('/search', {
			q: query,
			limit: options?.limit,
			folder: options?.folder
		});
		return response.data;
	}
}

/** System API module. */
class SystemAPI {
	constructor(private http: HttpClient) {}

	/** Get basic health status. */
	async health(): Promise<HealthStatus> {
		const response = await this.http.get<{
			success: boolean;
			data: HealthStatus;
		}>('/health');
		return response.data;
	}

	/** Get detailed health status. */
	async healthDetailed(): Promise<HealthStatus> {
		// The server currently exposes a single health endpoint.
		return this.health();
	}

	/** Get server identity. */
	async info(): Promise<ServerIdentity> {
		const response = await this.http.get<{
			success: boolean;
			data: ServerIdentity;
		}>('/system/info');
		return response.data;
	}

	/** Get system capabilities. */
	async capabilities(): Promise<SystemCapabilities> {
		const response = await this.http.get<{
			success: boolean;
			data: SystemCapabilities;
		}>('/system/capabilities');
		return response.data;
	}

	/** Get setup credentials (first-run only). */
	async setup(): Promise<Credentials> {
		const response = await this.http.get<{
			success: boolean;
			data: Credentials;
		}>('/system/setup');
		return response.data;
	}
}

/** Plugins API module. */
class PluginsAPI {
	constructor(private http: HttpClient) {}

	/** List installed plugins. */
	async list(): Promise<PluginManifest[]> {
		const response = await this.http.get<{
			success: boolean;
			data: PluginManifest[];
		}>('/plugins');
		return response.data;
	}

	/** Get marketplace catalog. */
	async marketplace(): Promise<PluginManifest[]> {
		const response = await this.http.get<{
			success: boolean;
			data: PluginManifest[];
		}>('/plugins/catalog');
		return response.data;
	}

	/** Install a plugin. */
	async install(id: string): Promise<PluginManifest> {
		const response = await this.http.post<{
			success: boolean;
			data: PluginManifest;
		}>('/plugins/install', { id });
		return response.data;
	}

	/** Uninstall a plugin. */
	async uninstall(id: string): Promise<void> {
		await this.http.delete(`/plugins/${id}`);
	}
}

/** Agent API module. */
class AgentAPI {
	constructor(private http: HttpClient) {}

	/** Chat with the AI agent. */
	async chat(
		message: string,
		options?: AgentChatOptions
	): Promise<AgentChatResponse> {
		const response = await this.http.post<{
			success: boolean;
			data: AgentChatResponse;
		}>('/agent/chat', {
			message,
			conversationId: options?.conversationId
		});
		return response.data;
	}

	/** Get agent status. */
	async status(): Promise<{
		enabled: boolean;
		provider: string;
		model: string;
	}> {
		const response = await this.http.get<{
			success: boolean;
			data: { enabled: boolean; provider: string; model: string };
		}>('/agent/status');
		return response.data;
	}
}

/** Channels API module. */
class ChannelsAPI {
	constructor(private http: HttpClient) {}

	/** List all channels. */
	async list(): Promise<ChannelConfig[]> {
		const response = await this.http.get<{
			success: boolean;
			data: ChannelConfig[];
		}>('/channels');
		return response.data;
	}

	/** Create a new channel. */
	async create(config: {
		provider: 'telegram' | 'whatsapp';
		name?: string;
		config?: Record<string, unknown>;
	}): Promise<ChannelConfig> {
		const response = await this.http.post<{
			success: boolean;
			data: ChannelConfig;
		}>('/channels', config);
		return response.data;
	}

	/** Delete a channel. */
	async delete(id: string): Promise<void> {
		await this.http.delete(`/channels/${id}`);
	}
}

// ============================================================================
// Main Client
// ============================================================================

/**
 * Main Mino API client.
 *
 * Provides typed access to all Mino API endpoints.
 */
export class MinoClient {
	private http: HttpClient;

	/** Notes API. */
	readonly notes: NotesAPI;

	/** Folders API. */
	readonly folders: FoldersAPI;

	/** Search API. */
	readonly search: SearchAPI;

	/** System API. */
	readonly system: SystemAPI;

	/** Plugins API. */
	readonly plugins: PluginsAPI;

	/** Agent API. */
	readonly agent: AgentAPI;

	/** Channels API. */
	readonly channels: ChannelsAPI;

	constructor(config: MinoClientConfig) {
		this.http = new HttpClient(config);
		this.notes = new NotesAPI(this.http);
		this.folders = new FoldersAPI(this.http);
		this.search = new SearchAPI(this.http);
		this.system = new SystemAPI(this.http);
		this.plugins = new PluginsAPI(this.http);
		this.agent = new AgentAPI(this.http);
		this.channels = new ChannelsAPI(this.http);
	}

	/**
	 * Creates a client from environment variables.
	 * Uses MINO_SERVER_URL and MINO_API_KEY.
	 */
	static fromEnv(): MinoClient {
		const serverUrl = envVar('MINO_SERVER_URL') ?? 'http://localhost:3000';
		const apiKey = envVar('MINO_API_KEY');

		if (!apiKey) {
			throw new Error('MINO_API_KEY environment variable is required');
		}

		return new MinoClient({ serverUrl, apiKey });
	}

	/** Verify the API key is valid. */
	async verify(): Promise<boolean> {
		try {
			await this.system.info();
			return true;
		} catch {
			return false;
		}
	}
}

// ============================================================================
// Exports
// ============================================================================

export default MinoClient;
