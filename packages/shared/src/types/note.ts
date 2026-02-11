/**
 * Note types — Core data model for Mino notes.
 *
 * Notes are markdown files on disk. These types represent their
 * in-memory / API representation. The file system is always the
 * source of truth; the SQLite index is derived and rebuildable.
 */

/** Parsed YAML frontmatter from a note. */
export interface NoteFrontmatter {
  /** Custom tags defined in frontmatter. */
  tags?: string[];
  /** Explicit creation date override. */
  created?: string;
  /** Any additional user-defined fields. */
  [key: string]: unknown;
}

/** Metadata derived from a note file (index-level, no content). */
export interface NoteMetadata {
  /** Relative path from the notes root, e.g. "Projects/Alpha/readme.md" */
  path: string;
  /** Title extracted from the first `# heading` or filename. */
  title: string;
  /** Tags from frontmatter + inline tags. */
  tags: string[];
  /** Outgoing `[[wiki-links]]` or `[markdown](links)` to other notes. */
  links: string[];
  /** Notes that link TO this one (populated by the index). */
  backlinks: string[];
  /** Word count of the note body. */
  wordCount: number;
  /** ISO 8601 creation timestamp. */
  createdAt: string;
  /** ISO 8601 last-modified timestamp. */
  updatedAt: string;
  /** SHA-256 hash of the raw file content (for sync / change detection). */
  checksum: string;
}

/** Full note object returned by the API (metadata + content). */
export interface Note extends NoteMetadata {
  /** Raw markdown content of the note. */
  content: string;
  /** Parsed frontmatter key-value pairs. */
  frontmatter: NoteFrontmatter;
}

/** Request body for `POST /api/v1/notes`. */
export interface CreateNoteRequest {
  /** Target path, e.g. "Projects/Alpha/readme.md". */
  path: string;
  /** Raw markdown content. */
  content: string;
}

/** Request body for `PUT /api/v1/notes/:path` (full replace). */
export interface UpdateNoteRequest {
  /** New raw markdown content. */
  content: string;
}

// ---------------------------------------------------------------------------
// Folder / tree types
// ---------------------------------------------------------------------------

/** A node in the folder tree (recursive). */
export interface FolderNode {
  /** Folder or file name. */
  name: string;
  /** Relative path from notes root. */
  path: string;
  /** Whether this is a directory. */
  isDirectory: boolean;
  /** Number of files in this folder (recursive, directories only). */
  fileCount?: number;
  /** Child nodes (directories only). */
  children?: FolderNode[];
}

/** Top-level folder tree response. */
export interface FolderTree {
  /** Root node representing the notes directory. */
  root: FolderNode;
  /** Total number of files across all folders. */
  totalFiles: number;
}
