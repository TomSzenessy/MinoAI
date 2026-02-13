/**
 * FileWatcher — Monitors the notes directory for external changes.
 *
 * Uses Node.js fs.watch with recursive option to detect changes
 * made outside the Mino application (e.g., git pull, external editors).
 *
 * Events are debounced and coalesced to prevent rapid-fire updates.
 */

import { watch, type FSWatcher } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import type { IndexDB } from './index-db';
import { FileManager } from './file-manager';

/** File change event types. */
export type FileEventType = 'add' | 'change' | 'unlink';

/** A single file change event. */
export interface FileEvent {
	/** Type of change. */
	type: FileEventType;
	/** Relative path from notes root. */
	path: string;
	/** Timestamp when the event occurred. */
	timestamp: number;
}

/** Options for the file watcher. */
export interface FileWatcherOptions {
	/** Debounce interval in ms (default: 200). */
	debounceMs?: number;
	/** Whether to emit initial scan events (default: false). */
	emitInitial?: boolean;
	/** Callback for file change events. */
	onChange?: (events: FileEvent[]) => void;
}

/**
 * Monitors a directory for file changes and notifies the index.
 * Designed for markdown files but works with any file type.
 */
export class FileWatcher {
	private watcher: FSWatcher | null = null;
	private notesDir: string;
	private index: IndexDB;
	private fm: FileManager;
	private options: Required<FileWatcherOptions>;
	private pendingEvents: Map<string, FileEvent> = new Map();
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;
	private isRunning = false;

	constructor(
		notesDir: string,
		index: IndexDB,
		options: FileWatcherOptions = {}
	) {
		this.notesDir = notesDir;
		this.index = index;
		this.fm = new FileManager(dirname(notesDir));
		this.options = {
			debounceMs: options.debounceMs ?? 200,
			emitInitial: options.emitInitial ?? false,
			onChange: options.onChange ?? (() => {})
		};
	}

	/**
	 * Starts watching the notes directory.
	 * Returns a promise that resolves when the watcher is ready.
	 */
	async start(): Promise<void> {
		if (this.isRunning) {
			return;
		}

		// Ensure directory exists
		if (!existsSync(this.notesDir)) {
			mkdirSync(this.notesDir, { recursive: true });
		}

		return new Promise((resolve, reject) => {
			try {
				this.watcher = watch(
					this.notesDir,
					{ recursive: true, persistent: true },
					(event, filename) => {
						if (!filename) return;
						this.handleFsEvent(event, filename);
					}
				);

				this.watcher.on('error', (error) => {
					console.error('[FileWatcher] Error:', error);
				});

				this.isRunning = true;
				console.log('[FileWatcher] Started watching:', this.notesDir);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}

	/** Stops watching the directory. */
	stop(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}

		if (this.watcher) {
			this.watcher.close();
			this.watcher = null;
		}

		this.isRunning = false;
		console.log('[FileWatcher] Stopped');
	}

	/** Returns whether the watcher is currently running. */
	isActive(): boolean {
		return this.isRunning;
	}

	// ===========================================================================
	// Private Methods
	// ===========================================================================

	/** Handles a raw filesystem event. */
	private handleFsEvent(event: string, filename: string): void {
		// Only process .md files
		if (extname(filename).toLowerCase() !== '.md') {
			return;
		}

		// Normalize path separators
		const normalizedPath = filename.replace(/\\/g, '/');
		const fullPath = join(this.notesDir, normalizedPath);

		// Determine event type
		let eventType: FileEventType;
		if (event === 'rename') {
			// 'rename' is emitted for both create and delete
			// Check if file exists to determine which
			eventType = existsSync(fullPath) ? 'add' : 'unlink';
		} else if (event === 'change') {
			eventType = 'change';
		} else {
			// Unknown event type, skip
			return;
		}

		// Add to pending events (coalesce multiple events for same file)
		const existing = this.pendingEvents.get(normalizedPath);
		if (existing) {
			// If we have an 'add' followed by 'unlink', cancel out
			if (existing.type === 'add' && eventType === 'unlink') {
				this.pendingEvents.delete(normalizedPath);
			} else if (existing.type === 'unlink' && eventType === 'add') {
				// File was deleted then recreated - treat as change
				existing.type = 'change';
			}
			existing.timestamp = Date.now();
		} else {
			this.pendingEvents.set(normalizedPath, {
				type: eventType,
				path: normalizedPath,
				timestamp: Date.now()
			});
		}

		// Debounce
		this.scheduleFlush();
	}

	/** Schedules a flush of pending events. */
	private scheduleFlush(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		this.debounceTimer = setTimeout(() => {
			this.flushEvents();
		}, this.options.debounceMs);
	}

	/** Flushes all pending events to the index. */
	private flushEvents(): void {
		const events = Array.from(this.pendingEvents.values());
		this.pendingEvents.clear();
		this.debounceTimer = null;

		if (events.length === 0) return;

		// Process events
		for (const event of events) {
			this.processEvent(event);
		}

		// Notify callback
		this.options.onChange(events);
	}

	/** Processes a single file event. */
	private async processEvent(event: FileEvent): Promise<void> {
		try {
			switch (event.type) {
				case 'add':
				case 'change': {
					const content = await this.fm.readFile(event.path);
					if (content !== null) {
						this.index.indexNote(event.path, content);
						console.log(`[FileWatcher] Indexed: ${event.path}`);
					}
					break;
				}
				case 'unlink': {
					this.index.removeNote(event.path);
					console.log(`[FileWatcher] Removed: ${event.path}`);
					break;
				}
			}
		} catch (error) {
			console.error(
				`[FileWatcher] Error processing ${event.path}:`,
				error
			);
		}
	}
}

/**
 * Creates and starts a file watcher for the given notes directory.
 * Returns the watcher instance for later cleanup.
 */
export async function startFileWatcher(
	notesDir: string,
	index: IndexDB,
	options?: FileWatcherOptions
): Promise<FileWatcher> {
	const watcher = new FileWatcher(notesDir, index, options);
	await watcher.start();
	return watcher;
}
