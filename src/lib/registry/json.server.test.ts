import { describe, expect, test } from "vitest";

import { registryItems } from "@/lib/registry/catalog";
import {
  getRegistryIndexJson,
  getRegistryIndexJsonResponse,
  getRegistryItemJsonResponse,
  getRegistrySourceValidationErrors,
} from "@/lib/registry/json.server";
import { registryItemSchema } from "@/lib/registry/metadata";

describe("registry JSON route responses", () => {
  test("serves the same registry index payload for canonical and alias routes", async () => {
    const canonicalResponse = getRegistryIndexJsonResponse();
    const aliasResponse = getRegistryIndexJsonResponse();
    const canonical = await readJson(canonicalResponse);
    const alias = await readJson(aliasResponse);

    expect(canonicalResponse.headers.get("Link")).toBeNull();
    expect(aliasResponse.headers.get("Link")).toBeNull();
    expect(canonical).toEqual(alias);
    expect(canonical).toEqual(getRegistryIndexJson());
  });

  test("serves registry item payloads for every live item", async () => {
    const itemResponses = await Promise.all(
      registryItems.map(async (item) => {
        const response = getRegistryItemJsonResponse(item.name);
        const json = await readJson(response);

        return { item, json, response };
      }),
    );

    for (const { item, json, response } of itemResponses) {
      expect(response.status).toBe(200);
      expect(response.headers.get("Link")).toBeNull();
      expect(json).toMatchObject({
        name: item.name,
        $schema: registryItemSchema,
      });
      expect(getFilePaths(json)).toEqual(item.files.map((file) => file.path));
    }
  });

  test("keeps authored docs out of registry JSON", () => {
    const registry = getRegistryIndexJson();
    const itemFilePaths = registry.items.flatMap((item) => item.files.map((file) => file.path));

    expect(itemFilePaths.some((path) => path.startsWith("registry/docs/"))).toBe(false);
  });

  test("returns JSON 404 responses for unknown items", async () => {
    const canonical = getRegistryItemJsonResponse("missing-item");
    const alias = getRegistryItemJsonResponse("missing-item");

    expect(canonical.status).toBe(404);
    expect(alias.status).toBe(404);
    expect(await readJson(canonical)).toEqual({ error: "Registry item not found." });
    expect(await readJson(alias)).toEqual({ error: "Registry item not found." });
  });

  test("reports missing and unsupported registry source files before JSON is served", () => {
    expect(
      getRegistrySourceValidationErrors({
        name: "broken-item",
        sourceFiles: [
          {
            sourcePath: "registry/items/broken/missing.tsx",
            source: "",
          },
          {
            sourcePath: "registry/items/broken/usage.md",
            source: "",
          },
        ],
      }),
    ).toEqual([
      `Registry item "broken-item" references a missing file: registry/items/broken/missing.tsx`,
      `Registry item "broken-item" references an unsupported source file type: registry/items/broken/usage.md`,
    ]);
  });
});

async function readJson(response: Response): Promise<unknown> {
  return response.json();
}

function getFilePaths(item: unknown): string[] {
  if (!isRecord(item) || !Array.isArray(item.files)) {
    throw new Error("Expected registry item JSON.");
  }

  return item.files.map((file) => {
    if (!isRecord(file) || typeof file.path !== "string") {
      throw new Error("Expected registry item file path.");
    }

    return file.path;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
