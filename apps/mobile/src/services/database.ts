/**
 * Database Service
 * SQLite-based local storage for notes.
 */

import * as SQLite from 'expo-sqlite';
import type { LocalNote, SyncQueueItem } from '@/types';

const DATABASE_NAME = 'mino.db';

interface SqlNoteRow {
  path: string;
  title: string;
  content: string;
  folder: string;
  tags: string;
  links: string;
  backlinks: string;
  frontmatter: string | null;
  checksum: string | null;
  wordCount: number;
  isDirty: number;
  isFavorite: number;
  syncVersion: number;
  createdAt: string;
  updatedAt: string;
}

interface SqlSyncQueueRow {
  id: string;
  path: string;
  operation: SyncQueueItem['operation'];
  timestamp: string;
  retryCount: number;
  payload: string | null;
}

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the database and create tables.
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS notes (
      path TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      folder TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      links TEXT NOT NULL DEFAULT '[]',
      backlinks TEXT NOT NULL DEFAULT '[]',
      frontmatter TEXT DEFAULT NULL,
      checksum TEXT DEFAULT NULL,
      word_count INTEGER DEFAULT 0,
      is_dirty INTEGER DEFAULT 0,
      is_favorite INTEGER DEFAULT 0,
      sync_version INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL,
      operation TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      retry_count INTEGER DEFAULT 0,
      payload TEXT
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
      path,
      title,
      content,
      content='notes',
      content_rowid='rowid'
    );

    CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
      INSERT INTO notes_fts(rowid, path, title, content)
      VALUES (new.rowid, new.path, new.title, new.content);
    END;

    CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
      INSERT INTO notes_fts(notes_fts, rowid, path, title, content)
      VALUES('delete', old.rowid, old.path, old.title, old.content);
    END;

    CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
      INSERT INTO notes_fts(notes_fts, rowid, path, title, content)
      VALUES('delete', old.rowid, old.path, old.title, old.content);
      INSERT INTO notes_fts(rowid, path, title, content)
      VALUES (new.rowid, new.path, new.title, new.content);
    END;

    CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder);
    CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at);
    CREATE INDEX IF NOT EXISTS idx_notes_is_favorite ON notes(is_favorite);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_path ON sync_queue(path);
  `);

  return db;
}

/**
 * Get the database instance.
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection.
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

// ============================================================================
// Notes CRUD Operations
// ============================================================================

/**
 * Get all notes (metadata only, no content).
 */
export async function getAllNotes(): Promise<Omit<LocalNote, 'content'>[]> {
  const database = getDatabase();
  const rows = await database.getAllAsync<SqlNoteRow>(`
    SELECT
      path,
      title,
      folder,
      tags,
      links,
      backlinks,
      frontmatter,
      checksum,
      word_count AS wordCount,
      is_dirty AS isDirty,
      is_favorite AS isFavorite,
      sync_version AS syncVersion,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM notes
    ORDER BY updated_at DESC
  `);

  return rows.map(parseNoteMetadataRow);
}

/**
 * Get all notes with full content in a single query.
 */
export async function getAllNotesWithContent(): Promise<LocalNote[]> {
  const database = getDatabase();
  const rows = await database.getAllAsync<SqlNoteRow>(`
    SELECT
      path,
      title,
      content,
      folder,
      tags,
      links,
      backlinks,
      frontmatter,
      checksum,
      word_count AS wordCount,
      is_dirty AS isDirty,
      is_favorite AS isFavorite,
      sync_version AS syncVersion,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM notes
    ORDER BY updated_at DESC
  `);

  return rows.map(parseNoteRow);
}

/**
 * Get a single note with content.
 */
export async function getNote(path: string): Promise<LocalNote | null> {
  const database = getDatabase();
  const row = await database.getFirstAsync<SqlNoteRow>(
    `
    SELECT
      path,
      title,
      content,
      folder,
      tags,
      links,
      backlinks,
      frontmatter,
      checksum,
      word_count AS wordCount,
      is_dirty AS isDirty,
      is_favorite AS isFavorite,
      sync_version AS syncVersion,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM notes
    WHERE path = ?
  `,
    [path]
  );

  return row ? parseNoteRow(row) : null;
}

/**
 * Create a new note.
 */
export async function createNote(note: LocalNote): Promise<void> {
  const database = getDatabase();
  const now = new Date().toISOString();

  await database.runAsync(
    `
    INSERT INTO notes (
      path,
      title,
      content,
      folder,
      tags,
      links,
      backlinks,
      frontmatter,
      checksum,
      word_count,
      is_dirty,
      is_favorite,
      sync_version,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      note.path,
      note.title,
      note.content,
      note.folder,
      JSON.stringify(note.tags),
      JSON.stringify(note.links),
      JSON.stringify(note.backlinks),
      note.frontmatter,
      note.checksum,
      note.wordCount,
      note.isDirty ? 1 : 0,
      note.isFavorite ? 1 : 0,
      note.syncVersion,
      note.createdAt || now,
      note.updatedAt || now,
    ]
  );
}

/**
 * Update an existing note.
 */
export async function updateNote(
  path: string,
  updates: Partial<LocalNote>
): Promise<void> {
  const database = getDatabase();
  const now = new Date().toISOString();
  const nextUpdatedAt = updates.updatedAt ?? now;

  const setClauses: string[] = ['updated_at = ?'];
  const values: (string | number | null)[] = [nextUpdatedAt];

  if (updates.createdAt !== undefined) {
    setClauses.push('created_at = ?');
    values.push(updates.createdAt);
  }

  if (updates.title !== undefined) {
    setClauses.push('title = ?');
    values.push(updates.title);
  }
  if (updates.content !== undefined) {
    setClauses.push('content = ?');
    values.push(updates.content);
  }
  if (updates.folder !== undefined) {
    setClauses.push('folder = ?');
    values.push(updates.folder);
  }
  if (updates.tags !== undefined) {
    setClauses.push('tags = ?');
    values.push(JSON.stringify(updates.tags));
  }
  if (updates.links !== undefined) {
    setClauses.push('links = ?');
    values.push(JSON.stringify(updates.links));
  }
  if (updates.backlinks !== undefined) {
    setClauses.push('backlinks = ?');
    values.push(JSON.stringify(updates.backlinks));
  }
  if (updates.frontmatter !== undefined) {
    setClauses.push('frontmatter = ?');
    values.push(updates.frontmatter);
  }
  if (updates.checksum !== undefined) {
    setClauses.push('checksum = ?');
    values.push(updates.checksum);
  }
  if (updates.wordCount !== undefined) {
    setClauses.push('word_count = ?');
    values.push(updates.wordCount);
  }
  if (updates.isDirty !== undefined) {
    setClauses.push('is_dirty = ?');
    values.push(updates.isDirty ? 1 : 0);
  }
  if (updates.isFavorite !== undefined) {
    setClauses.push('is_favorite = ?');
    values.push(updates.isFavorite ? 1 : 0);
  }
  if (updates.syncVersion !== undefined) {
    setClauses.push('sync_version = ?');
    values.push(updates.syncVersion);
  }

  values.push(path);

  await database.runAsync(
    `
    UPDATE notes SET ${setClauses.join(', ')} WHERE path = ?
  `,
    values
  );
}

/**
 * Delete a note.
 */
export async function deleteNote(path: string): Promise<void> {
  const database = getDatabase();
  await database.runAsync('DELETE FROM notes WHERE path = ?', [path]);
}

/**
 * Search notes using full-text search.
 */
export async function searchNotes(query: string, limit = 20): Promise<LocalNote[]> {
  const database = getDatabase();
  const searchQuery = query.replace(/['"]/g, '');

  const rows = await database.getAllAsync<SqlNoteRow>(
    `
    SELECT
      n.path,
      n.title,
      n.content,
      n.folder,
      n.tags,
      n.links,
      n.backlinks,
      n.frontmatter,
      n.checksum,
      n.word_count AS wordCount,
      n.is_dirty AS isDirty,
      n.is_favorite AS isFavorite,
      n.sync_version AS syncVersion,
      n.created_at AS createdAt,
      n.updated_at AS updatedAt
    FROM notes n
    JOIN notes_fts fts ON n.path = fts.path
    WHERE notes_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `,
    [searchQuery, limit]
  );

  return rows.map(parseNoteRow);
}

/**
 * Get notes by folder.
 */
export async function getNotesByFolder(folder: string): Promise<Omit<LocalNote, 'content'>[]> {
  const database = getDatabase();
  const rows = await database.getAllAsync<SqlNoteRow>(
    `
    SELECT
      path,
      title,
      folder,
      tags,
      links,
      backlinks,
      frontmatter,
      checksum,
      word_count AS wordCount,
      is_dirty AS isDirty,
      is_favorite AS isFavorite,
      sync_version AS syncVersion,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM notes
    WHERE folder = ?
    ORDER BY updated_at DESC
  `,
    [folder]
  );

  return rows.map(parseNoteMetadataRow);
}

/**
 * Get favorite notes.
 */
export async function getFavoriteNotes(): Promise<Omit<LocalNote, 'content'>[]> {
  const database = getDatabase();
  const rows = await database.getAllAsync<SqlNoteRow>(`
    SELECT
      path,
      title,
      folder,
      tags,
      links,
      backlinks,
      frontmatter,
      checksum,
      word_count AS wordCount,
      is_dirty AS isDirty,
      is_favorite AS isFavorite,
      sync_version AS syncVersion,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM notes
    WHERE is_favorite = 1
    ORDER BY updated_at DESC
  `);

  return rows.map(parseNoteMetadataRow);
}

/**
 * Get dirty (unsynced) notes.
 */
export async function getDirtyNotes(): Promise<LocalNote[]> {
  const database = getDatabase();
  const rows = await database.getAllAsync<SqlNoteRow>(`
    SELECT
      path,
      title,
      content,
      folder,
      tags,
      links,
      backlinks,
      frontmatter,
      checksum,
      word_count AS wordCount,
      is_dirty AS isDirty,
      is_favorite AS isFavorite,
      sync_version AS syncVersion,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM notes
    WHERE is_dirty = 1
  `);

  return rows.map(parseNoteRow);
}

// ============================================================================
// Sync Queue Operations
// ============================================================================

/**
 * Add item to sync queue.
 */
export async function addToSyncQueue(item: SyncQueueItem): Promise<void> {
  const database = getDatabase();
  await database.runAsync(
    `
    INSERT OR REPLACE INTO sync_queue (id, path, operation, timestamp, retry_count, payload)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
    [
      item.id,
      item.path,
      item.operation,
      item.timestamp,
      item.retryCount,
      item.payload ? JSON.stringify(item.payload) : null,
    ]
  );
}

/**
 * Get all pending sync items.
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const database = getDatabase();
  const rows = await database.getAllAsync<SqlSyncQueueRow>(`
    SELECT
      id,
      path,
      operation,
      timestamp,
      retry_count AS retryCount,
      payload
    FROM sync_queue
    ORDER BY timestamp ASC
  `);

  return rows.map((row) => ({
    id: row.id,
    path: row.path,
    operation: row.operation,
    timestamp: row.timestamp,
    retryCount: row.retryCount,
    payload: row.payload ? JSON.parse(row.payload) : undefined,
  }));
}

/**
 * Remove item from sync queue.
 */
export async function removeFromSyncQueue(id: string): Promise<void> {
  const database = getDatabase();
  await database.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
}

/**
 * Update retry count.
 */
export async function updateRetryCount(id: string, retryCount: number): Promise<void> {
  const database = getDatabase();
  await database.runAsync('UPDATE sync_queue SET retry_count = ? WHERE id = ?', [retryCount, id]);
}

/**
 * Clear sync queue.
 */
export async function clearSyncQueue(): Promise<void> {
  const database = getDatabase();
  await database.runAsync('DELETE FROM sync_queue');
}

// ============================================================================
// Helpers
// ============================================================================

function parseNoteRow(row: SqlNoteRow): LocalNote {
  return {
    path: row.path,
    title: row.title,
    content: row.content,
    folder: row.folder,
    tags: parseJsonArray(row.tags),
    links: parseJsonArray(row.links),
    backlinks: parseJsonArray(row.backlinks),
    frontmatter: row.frontmatter,
    checksum: row.checksum,
    wordCount: row.wordCount,
    isDirty: Boolean(row.isDirty),
    isFavorite: Boolean(row.isFavorite),
    syncVersion: row.syncVersion,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function parseNoteMetadataRow(row: SqlNoteRow): Omit<LocalNote, 'content'> {
  return {
    path: row.path,
    title: row.title,
    folder: row.folder,
    tags: parseJsonArray(row.tags),
    links: parseJsonArray(row.links),
    backlinks: parseJsonArray(row.backlinks),
    frontmatter: row.frontmatter,
    checksum: row.checksum,
    wordCount: row.wordCount,
    isDirty: Boolean(row.isDirty),
    isFavorite: Boolean(row.isFavorite),
    syncVersion: row.syncVersion,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export default {
  initDatabase,
  getDatabase,
  closeDatabase,
  getAllNotes,
  getAllNotesWithContent,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  searchNotes,
  getNotesByFolder,
  getFavoriteNotes,
  getDirtyNotes,
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  updateRetryCount,
  clearSyncQueue,
};
