import { describe, expect, it } from "bun:test";
import { generateOpenAPISpec } from "../src/openapi";

describe("OpenAPI spec", () => {
  it("documents X-Mino-Key as the API key header", () => {
    const spec = generateOpenAPISpec();
    expect(spec.components?.securitySchemes?.ApiKeyAuth?.name).toBe("X-Mino-Key");
  });

  it("documents note move payload using the path field", () => {
    const spec = generateOpenAPISpec();
    const movePatch = spec.paths["/api/v1/notes/{path}/move"]?.patch;
    const content = movePatch?.requestBody?.content["application/json"];
    expect(content).toBeDefined();

    const schema = content?.schema;
    if (!schema || "$ref" in schema) {
      throw new Error("Expected inline schema for note move payload");
    }

    expect(schema.required).toContain("path");
    expect(schema.properties?.path?.type).toBe("string");
  });

  it("uses plugin catalog endpoint in the spec", () => {
    const spec = generateOpenAPISpec();
    expect(spec.paths["/api/v1/plugins/catalog"]).toBeDefined();
    expect(spec.paths["/api/v1/plugins/marketplace"]).toBeUndefined();
  });
});
