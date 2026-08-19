import { afterEach, describe, expect, it } from "bun:test";
import { resolve } from "node:path";
import { getDataDir } from "../src/utils/paths";

const originalDataDir = process.env.MINO_DATA_DIR;

afterEach(() => {
  if (originalDataDir === undefined) {
    delete process.env.MINO_DATA_DIR;
  } else {
    process.env.MINO_DATA_DIR = originalDataDir;
  }
});

describe("getDataDir", () => {
  it("uses a project-local data directory by default", () => {
    delete process.env.MINO_DATA_DIR;

    expect(getDataDir()).toBe(resolve(process.cwd(), "data"));
  });

  it("honors an explicit data directory", () => {
    process.env.MINO_DATA_DIR = "./custom-data";

    expect(getDataDir()).toBe(resolve(process.cwd(), "custom-data"));
  });
});
