import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
  cleanupTestDataDir,
  createTestApp,
  createTestDataDir,
} from "./helpers/setup";

describe("Agent API", () => {
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

  it("returns contextual answers from note search", async () => {
    await app.request("/api/v1/notes", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        path: "architecture.md",
        content: "# Architecture\n\nEvent driven systems and service boundaries.",
      }),
    });

    const res = await app.request("/api/v1/agent/chat", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ message: "Find notes about architecture" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.reply).toContain("related note");
    expect(Array.isArray(body.data.actions)).toBe(true);
  });

  it("can create notes from explicit create-note intents", async () => {
    const res = await app.request("/api/v1/agent/chat", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ message: "Create note for API migration checklist" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    const createAction = body.data.actions.find(
      (action: { type: string }) => action.type === "create",
    );
    expect(createAction).toBeDefined();

    const notesRes = await app.request("/api/v1/notes", {
      headers: { "X-Mino-Key": apiKey },
    });
    const notesBody = await notesRes.json();
    expect(
      notesBody.data.some(
        (note: { path: string }) => note.path.startsWith("agent/"),
      ),
    ).toBe(true);
  });

  it("can move notes from explicit move intents", async () => {
    await app.request("/api/v1/notes", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        path: "inbox/move-target.md",
        content: "# Move Target\n\nMove me into archive.",
      }),
    });

    const res = await app.request("/api/v1/agent/chat", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        message: "Move note inbox/move-target.md to archive/move-target.md",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(
      body.data.actions.some(
        (action: { type: string }) => action.type === "move",
      ),
    ).toBe(true);

    const movedRes = await app.request("/api/v1/notes/archive/move-target.md", {
      headers: { "X-Mino-Key": apiKey },
    });
    expect(movedRes.status).toBe(200);
  });

  it("returns folder tree context when requested", async () => {
    await app.request("/api/v1/notes", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        path: "projects/tree-sample.md",
        content: "# Tree Sample\n\nUsed to test tree listing.",
      }),
    });

    const res = await app.request("/api/v1/agent/chat", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ message: "Show me the folder tree" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(
      body.data.actions.some(
        (action: { type: string }) => action.type === "tree",
      ),
    ).toBe(true);
    expect(body.data.reply).toContain("Top-level files and folders");
  });
});

describe("Channel API", () => {
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

  it("supports channel CRUD and toggle", async () => {
    const createRes = await app.request("/api/v1/channels", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        type: "telegram",
        name: "Main Telegram",
        webhookSecret: "s3cret",
        credentials: {
          botToken: "telegram-token",
        },
      }),
    });

    expect(createRes.status).toBe(200);
    const createdBody = await createRes.json();
    const channelId = createdBody.data.id as string;
    expect(channelId).toContain("ch_telegram_");

    const listRes = await app.request("/api/v1/channels", {
      headers: { "X-Mino-Key": apiKey },
    });
    expect(listRes.status).toBe(200);
    expect((await listRes.json()).data).toHaveLength(1);

    const toggleRes = await app.request(`/api/v1/channels/${channelId}/toggle`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ enabled: false }),
    });
    expect(toggleRes.status).toBe(200);
    expect((await toggleRes.json()).data.enabled).toBe(false);

    const deleteRes = await app.request(`/api/v1/channels/${channelId}`, {
      method: "DELETE",
      headers: { "X-Mino-Key": apiKey },
    });
    expect(deleteRes.status).toBe(200);
  });

  it("accepts telegram webhooks with valid secret", async () => {
    await app.request("/api/v1/channels", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        type: "telegram",
        name: "Agent Telegram",
        webhookSecret: "relay-secret",
      }),
    });

    await app.request("/api/v1/notes", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        path: "team/relays.md",
        content: "# Relays\n\nRelay connection checklist and diagnostics.",
      }),
    });

    const res = await app.request("/api/v1/channels/webhook/telegram", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Mino-Channel-Secret": "relay-secret",
      },
      body: JSON.stringify({
        message: {
          text: "Find relay checklist notes",
        },
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.handled).toBe(true);
    expect(body.data.reply).toContain("related");
  });

  it("rejects channel webhook with invalid secret", async () => {
    await app.request("/api/v1/channels", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        type: "telegram",
        name: "Agent Telegram",
        webhookSecret: "expected-secret",
      }),
    });

    const res = await app.request("/api/v1/channels/webhook/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          text: "hello",
        },
      }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});

describe("Plugin API", () => {
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

  it("supports plugin catalog, install, config, toggle, and uninstall", async () => {
    const catalogRes = await app.request("/api/v1/plugins/catalog", {
      headers: { "X-Mino-Key": apiKey },
    });
    expect(catalogRes.status).toBe(200);
    const catalog = (await catalogRes.json()).data as Array<{ id: string }>;
    expect(catalog.some((item) => item.id === "web-search")).toBe(true);

    const installRes = await app.request("/api/v1/plugins/install", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ id: "web-search" }),
    });
    expect(installRes.status).toBe(201);

    const configRes = await app.request("/api/v1/plugins/web-search/config", {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        config: {
          provider: "duckduckgo",
        },
      }),
    });
    expect(configRes.status).toBe(200);
    expect((await configRes.json()).data.config.provider).toBe("duckduckgo");

    const toggleRes = await app.request("/api/v1/plugins/web-search/toggle", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ enabled: false }),
    });
    expect(toggleRes.status).toBe(200);
    expect((await toggleRes.json()).data.enabled).toBe(false);

    const deleteRes = await app.request("/api/v1/plugins/web-search", {
      method: "DELETE",
      headers: { "X-Mino-Key": apiKey },
    });
    expect(deleteRes.status).toBe(200);
  });
});
