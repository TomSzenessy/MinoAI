/**
 * Notes CRUD Tests — Verifies the notes API endpoints.
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { createTestDataDir, cleanupTestDataDir, createTestApp } from "./helpers/setup";

describe("Notes API", () => {
  let dataDir: string;
  let apiKey: string;
  let app: ReturnType<typeof createTestApp>["app"];

  beforeEach(async () => {
    dataDir = await createTestDataDir();
    const result = createTestApp(dataDir);
    app = result.app;
    apiKey = result.deps.credentials.adminApiKey;
  });

  afterEach(async () => {
    await cleanupTestDataDir(dataDir);
  });

  const headers = () => ({
    "X-Mino-Key": apiKey,
    "Content-Type": "application/json",
  });

  it("creates a note", async () => {
    const res = await app.request("/api/v1/notes", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        path: "test-note.md",
        content: "# Test Note\n\nHello world.",
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.path).toBe("test-note.md");
    expect(body.data.title).toBe("Test Note");
    expect(body.data.wordCount).toBe(2); // "Hello world"
  });

  it("creates a note in a subfolder", async () => {
    const res = await app.request("/api/v1/notes", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        path: "Projects/Alpha/readme.md",
        content: "# Alpha Project\n\nArchitecture notes.",
      }),
    });

    expect(res.status).toBe(201);
    expect((await res.json()).data.path).toBe("Projects/Alpha/readme.md");
  });

  it("reads a note", async () => {
    // Create first
    await app.request("/api/v1/notes", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ path: "read-me.md", content: "# Read Me\n\nContent here." }),
    });

    // Read
    const res = await app.request("/api/v1/notes/read-me.md", {
      headers: { "X-Mino-Key": apiKey },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.title).toBe("Read Me");
    expect(body.data.content).toContain("Content here.");
  });

  it("returns 404 for non-existent note", async () => {
    const res = await app.request("/api/v1/notes/does-not-exist.md", {
      headers: { "X-Mino-Key": apiKey },
    });

    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("NOTE_NOT_FOUND");
  });

  it("updates a note", async () => {
    await app.request("/api/v1/notes", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ path: "update-me.md", content: "# Old Title" }),
    });

    const res = await app.request("/api/v1/notes/update-me.md", {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({ content: "# New Title\n\nUpdated content." }),
    });

    expect(res.status).toBe(200);
    expect((await res.json()).data.title).toBe("New Title");
  });

  it("deletes a note", async () => {
    await app.request("/api/v1/notes", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ path: "delete-me.md", content: "# Delete Me" }),
    });

    const deleteRes = await app.request("/api/v1/notes/delete-me.md", {
      method: "DELETE",
      headers: { "X-Mino-Key": apiKey },
    });

    expect(deleteRes.status).toBe(200);

    // Verify it's gone
    const getRes = await app.request("/api/v1/notes/delete-me.md", {
      headers: { "X-Mino-Key": apiKey },
    });
    expect(getRes.status).toBe(404);
  });

  it("prevents duplicate creation", async () => {
    await app.request("/api/v1/notes", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ path: "unique.md", content: "# Unique" }),
    });

    const res = await app.request("/api/v1/notes", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ path: "unique.md", content: "# Duplicate" }),
    });

    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("NOTE_ALREADY_EXISTS");
  });

  it("rejects path traversal attempts", async () => {
    const res = await app.request("/api/v1/notes", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ path: "../../../etc/passwd.md", content: "# Hack" }),
    });

    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects non-.md paths", async () => {
    const res = await app.request("/api/v1/notes", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ path: "test.txt", content: "# Not MD" }),
    });

    expect(res.status).toBe(400);
  });

  it("lists all notes", async () => {
    await app.request("/api/v1/notes", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ path: "note-a.md", content: "# Note A" }),
    });
    await app.request("/api/v1/notes", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ path: "note-b.md", content: "# Note B" }),
    });

    const res = await app.request("/api/v1/notes", {
      headers: { "X-Mino-Key": apiKey },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
  });
});

describe("Search API", () => {
  let dataDir: string;
  let apiKey: string;
  let app: ReturnType<typeof createTestApp>["app"];

  beforeEach(async () => {
    dataDir = await createTestDataDir();
    const result = createTestApp(dataDir);
    app = result.app;
    apiKey = result.deps.credentials.adminApiKey;
  });

  afterEach(async () => {
    await cleanupTestDataDir(dataDir);
  });

  it("finds notes by content", async () => {
    await app.request("/api/v1/notes", {
      method: "POST",
      headers: { "X-Mino-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ path: "searchable.md", content: "# Architecture\n\nThis note discusses microservices and APIs." }),
    });

    const res = await app.request("/api/v1/search?q=microservices", {
      headers: { "X-Mino-Key": apiKey },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].path).toBe("searchable.md");
    expect(body.data[0].snippet).toContain("microservices");
  });

  it("returns empty for no matches", async () => {
    const res = await app.request("/api/v1/search?q=nonexistent", {
      headers: { "X-Mino-Key": apiKey },
    });

    expect(res.status).toBe(200);
    expect((await res.json()).data).toHaveLength(0);
  });

  it("requires q parameter", async () => {
    const res = await app.request("/api/v1/search", {
      headers: { "X-Mino-Key": apiKey },
    });

    expect(res.status).toBe(400);
  });
});

describe("Path Safety", () => {
  it("validates paths correctly", async () => {
    const { validateNotePath } = await import("../src/utils/paths");

    expect(validateNotePath("valid-note.md")).toBeNull();
    expect(validateNotePath("folder/nested/note.md")).toBeNull();
    expect(validateNotePath("../escape.md")).not.toBeNull();
    expect(validateNotePath("/absolute.md")).not.toBeNull();
    expect(validateNotePath("file.txt")).not.toBeNull(); // not .md
    expect(validateNotePath("")).not.toBeNull();
    expect(validateNotePath("a".repeat(501) + ".md")).not.toBeNull();
  });
});
