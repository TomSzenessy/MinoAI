/**
 * Static Web UI Tests — verifies built web assets are served without breaking API routes.
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { cleanupTestDataDir, createTestApp, createTestDataDir } from "./helpers/setup";

describe("Static Web UI", () => {
  let dataDir: string;
  let webDir: string;

  beforeEach(async () => {
    dataDir = await createTestDataDir();
    webDir = await mkdtemp(join(tmpdir(), "mino-web-"));

    await writeFile(join(webDir, "index.html"), "<html><body>home</body></html>", "utf-8");
    await writeFile(join(webDir, "link.html"), "<html><body>link</body></html>", "utf-8");
    await writeFile(join(webDir, "workspace.html"), "<html><body>workspace</body></html>", "utf-8");
    await writeFile(join(webDir, "docs.html"), "<html><body>docs</body></html>", "utf-8");
  });

  afterEach(async () => {
    await cleanupTestDataDir(dataDir);
    await rm(webDir, { recursive: true, force: true });
  });

  it("serves static html routes", async () => {
    const { app } = createTestApp(dataDir, { webDistDir: webDir });

    const home = await app.request("/");
    expect(home.status).toBe(200);
    expect(await home.text()).toContain("home");

    const link = await app.request("/link");
    expect(link.status).toBe(200);
    expect(await link.text()).toContain("link");

    const workspace = await app.request("/workspace");
    expect(workspace.status).toBe(200);
    expect(await workspace.text()).toContain("workspace");

    const docs = await app.request("/docs");
    expect(docs.status).toBe(200);
    expect(await docs.text()).toContain("docs");
  });

  it("keeps API routes functional", async () => {
    const { app } = createTestApp(dataDir, { webDistDir: webDir });

    const health = await app.request("/api/v1/health");
    expect(health.status).toBe(200);

    const body = await health.json();
    expect(body.success).toBe(true);
  });

  it("returns 404 for non-api routes when web ui is not bundled", async () => {
    const { app } = createTestApp(dataDir, { webDistDir: null });

    const response = await app.request("/");
    expect(response.status).toBe(404);
    expect(await response.text()).toContain("Web UI is not bundled");
  });
});
