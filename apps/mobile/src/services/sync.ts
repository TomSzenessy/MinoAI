/**
 * Sync Service
 * Yjs-based conflict-free sync engine
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MinoClient } from '@mino-ink/api-client';
import type { SyncQueueItem, ServerConnection } from '@/types';
import * as database from './database';
import * as storage from './storage';

// Sync state
interface SyncState {
	isSyncing: boolean;
	lastSyncAt: string | null;
	error: string | null;
	pendingCount: number;
}

type SyncListener = (state: SyncState) => void;

class SyncEngine {
	private ydoc: Y.Doc | null = null;
	private wsProvider: WebsocketProvider | null = null;
	private client: MinoClient | null = null;
	private state: SyncState = {
		isSyncing: false,
		lastSyncAt: null,
		error: null,
		pendingCount: 0
	};
	private listeners: Set<SyncListener> = new Set();
	private syncInterval: ReturnType<typeof setInterval> | null = null;

	/**
	 * Initialize sync with server connection
	 */
	async initialize(connection: ServerConnection): Promise<void> {
		this.client = new MinoClient({
			serverUrl: connection.url,
			apiKey: connection.apiKey
		});

		// Load last sync time
		this.state.lastSyncAt = await storage.getLastSync();

		// Initialize Yjs document
		this.ydoc = new Y.Doc();

		// Connect WebSocket for real-time sync
		try {
			const wsUrl = connection.url.replace(/^http/, 'ws') + '/sync';
			this.wsProvider = new WebsocketProvider(
				wsUrl,
				'mino-notes',
				this.ydoc,
				{
					params: { apiKey: connection.apiKey }
				}
			);

			this.wsProvider.on('status', (event: { status: string }) => {
				if (event.status === 'connected') {
					void this.sync().catch(console.error);
				}
			});
		} catch (error) {
			console.error('Failed to connect WebSocket:', error);
		}
	}

	/**
	 * Disconnect and cleanup
	 */
	disconnect(): void {
		if (this.syncInterval) {
			clearInterval(this.syncInterval);
			this.syncInterval = null;
		}
		if (this.wsProvider) {
			this.wsProvider.disconnect();
			this.wsProvider = null;
		}
		if (this.ydoc) {
			this.ydoc.destroy();
			this.ydoc = null;
		}
		this.client = null;
	}

	/**
	 * Perform full sync
	 */
	async sync(): Promise<void> {
		if (!this.client || this.state.isSyncing) return;

		this.updateState({ isSyncing: true, error: null });

		try {
			// 1. Push local changes
			await this.pushChanges();

			// 2. Pull remote changes
			await this.pullChanges();

			// 3. Update last sync time
			const now = new Date().toISOString();
			await storage.setLastSync(now);
			this.updateState({ lastSyncAt: now, isSyncing: false });
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Sync failed';
			this.updateState({ error: errorMessage, isSyncing: false });
			throw error;
		}
	}

	/**
	 * Push local changes to server
	 */
	private async pushChanges(): Promise<void> {
		const queue = await database.getSyncQueue();

		for (const item of queue) {
			try {
				await this.processSyncItem(item);
				await database.removeFromSyncQueue(item.id);
			} catch (error) {
				if (item.retryCount < 3) {
					await database.updateRetryCount(
						item.id,
						item.retryCount + 1
					);
				}
				throw error;
			}
		}

		this.updateState({ pendingCount: 0 });
	}

	/**
	 * Process a single sync queue item
	 */
	private async processSyncItem(item: SyncQueueItem): Promise<void> {
		if (!this.client) return;

		switch (item.operation) {
			case 'create':
			case 'update': {
				const note = await database.getNote(item.path);
				if (note) {
					if (item.operation === 'create') {
						await this.client.notes.create(item.path, note.content);
					} else {
						await this.client.notes.update(item.path, note.content);
					}
					// Mark as clean
					await database.updateNote(item.path, { isDirty: false });
				}
				break;
			}
			case 'delete':
				await this.client.notes.delete(item.path);
				break;
		}
	}

	/**
	 * Pull remote changes from server
	 */
	private async pullChanges(): Promise<void> {
		if (!this.client) return;

		const remoteNotes = await this.client.notes.list();
		const localNotes = await database.getAllNotes();
		const localNotesByPath = new Map(localNotes.map((note) => [note.path, note]));

		const localPaths = new Set(localNotes.map((n) => n.path));
		const remotePaths = new Set(remoteNotes.map((n) => n.path));

		// New remote notes
		for (const remoteNote of remoteNotes) {
			if (!localPaths.has(remoteNote.path)) {
				// Fetch full content and save locally
				const fullNote = await this.client!.notes.get(remoteNote.path);
				await database.createNote({
					path: fullNote.path,
					title:
						this.extractTitle(fullNote.content) || remoteNote.path,
					content: fullNote.content,
					folder: this.extractFolder(remoteNote.path),
					tags: fullNote.tags ?? [],
					links: fullNote.links ?? [],
					backlinks: fullNote.backlinks ?? [],
					frontmatter: fullNote.frontmatter
						? JSON.stringify(fullNote.frontmatter)
						: null,
					checksum: fullNote.checksum ?? null,
					wordCount: this.countWords(fullNote.content),
					isDirty: false,
					isFavorite: false,
					syncVersion: 1,
					createdAt: fullNote.createdAt,
					updatedAt: fullNote.updatedAt
				});
				continue;
			}

			const localNote = localNotesByPath.get(remoteNote.path);
			if (!localNote || localNote.isDirty) {
				continue;
			}

			const remoteUpdatedAt = Date.parse(remoteNote.updatedAt);
			const localUpdatedAt = Date.parse(localNote.updatedAt);
			const shouldRefresh =
				!Number.isFinite(localUpdatedAt) ||
				(Number.isFinite(remoteUpdatedAt) &&
					remoteUpdatedAt > localUpdatedAt);

			if (shouldRefresh) {
				const fullNote = await this.client!.notes.get(remoteNote.path);
				await database.updateNote(remoteNote.path, {
					title: this.extractTitle(fullNote.content) || fullNote.title,
					content: fullNote.content,
					folder: this.extractFolder(remoteNote.path),
					tags: fullNote.tags ?? [],
					links: fullNote.links ?? [],
					backlinks: fullNote.backlinks ?? [],
					frontmatter: fullNote.frontmatter
						? JSON.stringify(fullNote.frontmatter)
						: null,
					checksum: fullNote.checksum ?? null,
					wordCount: fullNote.wordCount,
					isDirty: false,
					syncVersion: Math.max(localNote.syncVersion, 1) + 1,
					createdAt: fullNote.createdAt,
					updatedAt: fullNote.updatedAt
				});
			}
		}

		// Deleted remote notes
		for (const localNote of localNotes) {
			if (!remotePaths.has(localNote.path) && !localNote.isDirty) {
				await database.deleteNote(localNote.path);
			}
		}
	}

	/**
	 * Queue a note for sync
	 */
	async queueNote(
		path: string,
		operation: SyncQueueItem['operation']
	): Promise<void> {
		const item: SyncQueueItem = {
			id: `${path}-${operation}-${Date.now()}`,
			path,
			operation,
			timestamp: new Date().toISOString(),
			retryCount: 0
		};

		await database.addToSyncQueue(item);
		this.updateState({ pendingCount: this.state.pendingCount + 1 });

		// Try to sync immediately if connected
		if (this.wsProvider?.wsconnected) {
			this.sync().catch(console.error);
		}
	}

	/**
	 * Start periodic sync
	 */
	startPeriodicSync(intervalMinutes: number): void {
		if (this.syncInterval) {
			clearInterval(this.syncInterval);
		}
		this.syncInterval = setInterval(
			() => {
				this.sync().catch(console.error);
			},
			intervalMinutes * 60 * 1000
		);
	}

	/**
	 * Subscribe to sync state changes
	 */
	subscribe(listener: SyncListener): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	/**
	 * Get current sync state
	 */
	getState(): SyncState {
		return { ...this.state };
	}

	/**
	 * Update state and notify listeners
	 */
	private updateState(updates: Partial<SyncState>): void {
		this.state = { ...this.state, ...updates };
		this.listeners.forEach((listener) => listener(this.state));
	}

	/**
	 * Extract title from markdown content
	 */
	private extractTitle(content: string): string | null {
		const title = content.match(/^#\s+(.+)$/m)?.[1];
		return title ? title.trim() : null;
	}

	/**
	 * Extract folder from path
	 */
	private extractFolder(path: string): string {
		const parts = path.split('/');
		parts.pop();
		return parts.join('/');
	}

	/**
	 * Count words in content
	 */
	private countWords(content: string): number {
		return content
			.replace(/[#*`_\[\]]/g, '')
			.split(/\s+/)
			.filter(Boolean).length;
	}
}

// Singleton instance
export const syncEngine = new SyncEngine();

export default syncEngine;
