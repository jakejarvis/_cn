import { describe, expect, test } from "vitest";

import {
  getRegistryIndexJson,
  getRegistryIndexJsonResponse,
  getRegistryItemJsonResponse,
  getRegistrySourceValidationErrors,
} from "@/lib/registry/json.server";

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

  test("serves the same item payload for canonical and alias routes", async () => {
    const canonicalResponse = getRegistryItemJsonResponse("example-card");
    const aliasResponse = getRegistryItemJsonResponse("example-card");
    const canonical = await readJson(canonicalResponse);
    const alias = await readJson(aliasResponse);

    expect(canonicalResponse.headers.get("Link")).toBeNull();
    expect(aliasResponse.headers.get("Link")).toBeNull();
    expect(canonical).toEqual(alias);
    expect(canonical).toMatchObject({
      name: "example-card",
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
    });
  });

  test("publishes install-time aliases for relative registry source imports", async () => {
    const item = await readJson(getRegistryItemJsonResponse("stats-panel"));

    expect(getFileContent(item, "registry/items/blocks/stats-panel/stats-panel.tsx")).toContain(
      `from "@/components/ui/example-card"`,
    );
    expect(getFileContent(item, "registry/items/blocks/stats-panel/stats-panel.tsx")).toContain(
      `from "@/lib/stats-data"`,
    );
  });

  test("keeps authored docs out of registry JSON", async () => {
    const registry = getRegistryIndexJson();
    const itemFilePaths = registry.items.flatMap((item) => item.files.map((file) => file.path));

    expect(itemFilePaths.some((path) => path.startsWith("registry/docs/"))).toBe(false);
    expect(registry.items.map((item) => item.name)).not.toContain("installation");
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

function getFileContent(item: unknown, path: string): string {
  if (!isRecord(item) || !Array.isArray(item.files)) {
    throw new Error("Expected registry item JSON.");
  }

  const file = item.files.find(
    (candidate): candidate is { path: string; content: string } =>
      isRecord(candidate) && candidate.path === path && typeof candidate.content === "string",
  );

  if (!file) {
    throw new Error(`Expected registry item file: ${path}`);
  }

  return file.content;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
