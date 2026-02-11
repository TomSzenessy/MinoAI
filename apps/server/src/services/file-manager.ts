/**
 * FileManager — Low-level file system operations.
 *
 * Handles reading, writing, listing, and deleting files
 * within the notes directory. All paths are validated to
 * prevent traversal attacks.
 */

import { readdir, stat, mkdir, unlink } from "node:fs/promises";
import { join, relative, extname } from "node:path";
import { existsSync } from "node:fs";
import type { FolderNode, FolderTree } from "@mino-ink/shared";
import { getNotesDir, resolveNotePath, toRelativePath } from "../utils/paths";

export class FileManager {
  private readonly notesDir: string;

  constructor(dataDir: string) {
    this.notesDir = getNotesDir(dataDir);
  }

  /** Reads a file's content as a string. Returns null if not found. */
  async readFile(relativePath: string): Promise<string | null> {
    const absPath = resolveNotePath(this.notesDir, relativePath);
    const file = Bun.file(absPath);

    if (!(await file.exists())) return null;
    return file.text();
  }

  /** Writes content to a file, creating parent directories as needed. */
  async writeFile(relativePath: string, content: string): Promise<void> {
    const absPath = resolveNotePath(this.notesDir, relativePath);
    const dir = join(absPath, "..");
    await mkdir(dir, { recursive: true });
    await Bun.write(absPath, content);
  }

  /** Checks if a file exists at the given relative path. */
  async fileExists(relativePath: string): Promise<boolean> {
    const absPath = resolveNotePath(this.notesDir, relativePath);
    return Bun.file(absPath).exists();
  }

  /** Deletes a file at the given relative path. */
  async deleteFile(relativePath: string): Promise<void> {
    const absPath = resolveNotePath(this.notesDir, relativePath);
    await unlink(absPath);
  }

  /**
   * Lists all .md files in the notes directory (recursively).
   * Returns relative paths.
   */
  async listAllFiles(subfolder?: string): Promise<string[]> {
    const baseDir = subfolder
      ? resolveNotePath(this.notesDir, subfolder)
      : this.notesDir;

    if (!existsSync(baseDir)) return [];

    const files: string[] = [];
    await this.walkDirectory(baseDir, files);
    return files.map((f) => toRelativePath(this.notesDir, f));
  }

  /** Gets the file tree (folders with file counts). */
  async getTree(subfolder?: string): Promise<FolderTree> {
    const baseDir = subfolder
      ? resolveNotePath(this.notesDir, subfolder)
      : this.notesDir;

    if (!existsSync(baseDir)) {
      return {
        root: { name: "notes", path: "", isDirectory: true, fileCount: 0, children: [] },
        totalFiles: 0,
      };
    }

    const root = await this.buildTreeNode(baseDir, "");
    const totalFiles = this.countFiles(root);

    return { root, totalFiles };
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /** Recursively walks a directory, collecting all .md file paths. */
  private async walkDirectory(dir: string, files: string[]): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip hidden directories
        if (!entry.name.startsWith(".")) {
          await this.walkDirectory(fullPath, files);
        }
      } else if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") {
        files.push(fullPath);
      }
    }
  }

  /** Recursively builds a FolderNode tree. */
  private async buildTreeNode(absPath: string, relativePath: string): Promise<FolderNode> {
    const entries = await readdir(absPath, { withFileTypes: true });
    const children: FolderNode[] = [];
    let fileCount = 0;

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue; // skip hidden

      const childRelPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        const childNode = await this.buildTreeNode(join(absPath, entry.name), childRelPath);
        children.push(childNode);
        fileCount += childNode.fileCount ?? 0;
      } else if (extname(entry.name).toLowerCase() === ".md") {
        fileCount++;
        children.push({
          name: entry.name,
          path: childRelPath,
          isDirectory: false,
        });
      }
    }

    const name = relativePath.split("/").pop() || "notes";
    return { name, path: relativePath, isDirectory: true, fileCount, children };
  }

  /** Counts total files in a tree node (recursive). */
  private countFiles(node: FolderNode): number {
    if (!node.isDirectory) return 1;
    return (node.children ?? []).reduce((sum, child) => sum + this.countFiles(child), 0);
  }
}
