import { registryItemSchema as shadcnRegistryItemSchema } from "shadcn/schema";
import { describe, expect, test, vi } from "vitest";

import { registryItems } from "./catalog";
import type { RegistryCatalogItem } from "./catalog-builder";
import {
  getRegistryIndexJson,
  getRegistryIndexJsonResponse,
  getRegistryItemJsonResponse,
  getRegistrySourceValidationErrors,
} from "./json.server";
import { registryItemSchema } from "./metadata";

const { fixtureRegistryItems, fixtureRegistrySourceByPath } = vi.hoisted(() => {
  const mockedRegistryItems: RegistryCatalogItem[] = [
    {
      name: "alpha-card",
      title: "Alpha Card",
      description: "A compact card component.",
      type: "registry:ui",
      files: [{ path: "ui/alpha-card.tsx", type: "registry:ui" }],
      sourceFiles: [
        {
          path: "ui/alpha-card.tsx",
          sourcePath: "registry/items/components/alpha-card/alpha-card.tsx",
          fileName: "alpha-card.tsx",
          type: "registry:ui",
        },
      ],
      previewSourceFile: {
        path: "registry/items/components/alpha-card/_registry.mdx",
        fileName: "_registry.mdx",
        source: "",
      },
      hasPreview: false,
      hasUsage: false,
      usageSource: "",
    },
    {
      name: "metrics-panel",
      title: "Metrics Panel",
      description: "A dashboard metrics block.",
      type: "registry:block",
      files: [
        { path: "components/metrics-panel.tsx", type: "registry:component" },
        { path: "lib/metrics-data.ts", type: "registry:lib" },
      ],
      sourceFiles: [
        {
          path: "components/metrics-panel.tsx",
          sourcePath: "registry/items/blocks/metrics-panel/metrics-panel.tsx",
          fileName: "metrics-panel.tsx",
          type: "registry:component",
        },
        {
          path: "lib/metrics-data.ts",
          sourcePath: "registry/items/blocks/metrics-panel/metrics-data.ts",
          fileName: "metrics-data.ts",
          type: "registry:lib",
        },
      ],
      previewSourceFile: {
        path: "registry/items/blocks/metrics-panel/_registry.mdx",
        fileName: "_registry.mdx",
        source: "",
      },
      hasPreview: false,
      hasUsage: false,
      usageSource: "",
    },
    {
      name: "use-alpha-state",
      title: "useAlphaState",
      description: "A small state hook.",
      type: "registry:hook",
      files: [{ path: "hooks/use-alpha-state.ts", type: "registry:hook" }],
      sourceFiles: [
        {
          path: "hooks/use-alpha-state.ts",
          sourcePath: "registry/items/hooks/use-alpha-state/use-alpha-state.ts",
          fileName: "use-alpha-state.ts",
          type: "registry:hook",
        },
      ],
      previewSourceFile: {
        path: "registry/items/hooks/use-alpha-state/_registry.mdx",
        fileName: "_registry.mdx",
        source: "",
      },
      hasPreview: false,
      hasUsage: false,
      usageSource: "",
    },
  ];
  const mockedRegistrySourceByPath: Record<string, string> = {
    "registry/items/components/alpha-card/alpha-card.tsx":
      "export function AlphaCard() {\n  return <div>Alpha</div>;\n}",
    "registry/items/blocks/metrics-panel/metrics-panel.tsx":
      'import { metrics } from "./metrics-data";\n\nexport function MetricsPanel() {\n  return <div>{metrics.total}</div>;\n}',
    "registry/items/blocks/metrics-panel/metrics-data.ts": "export const metrics = { total: 42 };",
    "registry/items/hooks/use-alpha-state/use-alpha-state.ts":
      'import { useState } from "react";\n\nexport function useAlphaState() {\n  return useState("alpha");\n}',
  };

  return {
    fixtureRegistryItems: mockedRegistryItems,
    fixtureRegistrySourceByPath: mockedRegistrySourceByPath,
  };
});

vi.mock("./catalog", () => ({
  getRegistryItem: (name: string) => fixtureRegistryItems.find((item) => item.name === name),
  registryItems: fixtureRegistryItems,
}));

vi.mock("./source.server", () => ({
  getRegistryItemWithSources: (item: RegistryCatalogItem) => ({
    ...item,
    sourceFiles: item.sourceFiles.map((file) => ({
      ...file,
      source: fixtureRegistrySourceByPath[file.sourcePath] ?? "",
    })),
    previewSourceFile: {
      ...item.previewSourceFile,
      source: item.previewSourceFile.source.trimEnd(),
    },
  }),
}));

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

  test("serves registry item payloads for every mocked item", async () => {
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
    const itemFilePaths = registry.items.flatMap((item) =>
      (item.files ?? []).map((file) => file.path),
    );

    expect(itemFilePaths.some((path) => path.startsWith("registry/docs/"))).toBe(false);
  });

  test("emits install paths instead of registry authoring source paths", async () => {
    const alphaCard = await readJson(getRegistryItemJsonResponse("alpha-card"));
    const metricsPanel = await readJson(getRegistryItemJsonResponse("metrics-panel"));
    const alphaStateHook = await readJson(getRegistryItemJsonResponse("use-alpha-state"));

    expect(getFilePaths(alphaCard)).toEqual(["ui/alpha-card.tsx"]);
    expect(getFilePaths(metricsPanel)).toEqual([
      "components/metrics-panel.tsx",
      "lib/metrics-data.ts",
    ]);
    expect(getFilePaths(alphaStateHook)).toEqual(["hooks/use-alpha-state.ts"]);
  });

  test("returns JSON 404 responses for unknown items", async () => {
    const canonical = getRegistryItemJsonResponse("missing-item");
    const alias = getRegistryItemJsonResponse("missing-item");

    expect(canonical.status).toBe(404);
    expect(alias.status).toBe(404);
    expect(await readJson(canonical)).toEqual({ error: "Registry item not found." });
    expect(await readJson(alias)).toEqual({ error: "Registry item not found." });
  });

  test("reports missing registry source files before JSON is served", () => {
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
      `Registry item "broken-item" references a missing file: registry/items/broken/usage.md`,
    ]);
  });

  test("validates representative public registry item examples against shadcn schema", () => {
    const examples = [
      {
        name: "custom-theme",
        type: "registry:theme",
        cssVars: {
          theme: {
            "font-heading": "Inter, sans-serif",
          },
        },
      },
      {
        name: "custom-style",
        type: "registry:style",
        css: {
          "@layer base": {
            h1: {
              "font-size": "var(--text-2xl)",
            },
          },
        },
      },
      {
        name: "font-inter",
        type: "registry:font",
        font: {
          family: "'Inter Variable', sans-serif",
          provider: "google",
          import: "Inter",
          variable: "--font-sans",
          subsets: ["latin"],
          dependency: "@fontsource-variable/inter",
        },
      },
      {
        name: "python-rules",
        type: "registry:item",
        files: [
          {
            path: "registry/items/items/python-rules/custom-python.mdc",
            type: "registry:file",
            target: "~/.cursor/rules/custom-python.mdc",
            content: "Use Python 3.14.",
          },
        ],
      },
    ];

    for (const example of examples) {
      expect(shadcnRegistryItemSchema.safeParse(example).success).toBe(true);
    }
  });

  test("requires targets for page and file payload entries", () => {
    for (const type of ["registry:page", "registry:file"] as const) {
      const result = shadcnRegistryItemSchema.safeParse({
        name: "missing-target",
        type: "registry:item",
        files: [
          {
            path: "registry/items/items/missing-target/source.ts",
            type,
            content: "export {};",
          },
        ],
      });

      expect(result.success).toBe(false);
    }
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
