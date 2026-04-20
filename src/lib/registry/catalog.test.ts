import { describe, expect, test } from "vitest";

import {
  componentRegistryTypes,
  getRegistryItemsByTypes,
  registryMetadataItems,
  registryItems,
} from "@/lib/registry/catalog";
import { getRegistryDisplaySource } from "@/lib/registry/display-source.server";
import {
  getRegistryIndexJson,
  getRegistryItemJson,
  getRegistryValidationErrors,
} from "@/lib/registry/json.server";
import { registryItemSchema } from "@/lib/registry/metadata";
import { getRegistrySectionsWithItems } from "@/lib/registry/sections";
import {
  getMissingRegistryPreviewPaths,
  getMissingRegistrySourcePaths,
  getRegistryItemWithSources,
  getUnsupportedRegistrySourcePaths,
  isSupportedRegistrySourcePath,
  trimBlankTrailingLines,
} from "@/lib/registry/source.server";

const registryItemCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

describe("registry catalog", () => {
  test("has unique item names", () => {
    const names = registryItems.map((item) => item.name);

    expect(new Set(names).size).toBe(names.length);
  });

  test("orders registry item lists alphabetically", () => {
    const registryIndexItems = getRegistryIndexJson().items;

    expect(registryItems.map((item) => item.name)).toEqual(getAlphabetizedItemNames(registryItems));
    expect(registryMetadataItems.map((item) => item.name)).toEqual(
      getAlphabetizedItemNames(registryMetadataItems),
    );
    expect(registryIndexItems.map((item) => item.name)).toEqual(
      getAlphabetizedItemNames(registryIndexItems),
    );

    for (const types of [componentRegistryTypes, ["registry:block"] as const]) {
      const items = getRegistryItemsByTypes(types);

      expect(items.map((item) => item.name)).toEqual(getAlphabetizedItemNames(items));
    }
  });

  test("matches the registry index", () => {
    const catalogNames = registryItems.map((item) => item.name).toSorted();
    const registryNames = getRegistryIndexJson()
      .items.map((item) => item.name)
      .toSorted();

    expect(catalogNames).toEqual(registryNames);
  });

  test("builds the registry index from item metadata", () => {
    expect(getRegistryIndexJson().items).toEqual(registryMetadataItems);
  });

  test("builds shadcn registry item JSON with file contents", () => {
    for (const item of registryItems) {
      const registryItemJson = getRegistryItemJson(item.name);

      expect(registryItemJson).not.toBeNull();
      expect(registryItemJson?.$schema).toBe(registryItemSchema);
      expect(registryItemJson?.name).toBe(item.name);
      expect(registryItemJson?.files.map(toRegistryFileDefinition)).toEqual(item.files);
      expect(registryItemJson?.files.every((file) => file.content.length > 0)).toBe(true);
      expect(registryItemJson).not.toHaveProperty("hasUsage");
      expect(registryItemJson).not.toHaveProperty("usageSource");
      expect(registryItemJson).not.toHaveProperty("previewSourceFile");
    }
  });

  test("returns null for unknown registry item JSON", () => {
    expect(getRegistryItemJson("missing-item")).toBeNull();
  });

  test("validates published registry metadata and sources", () => {
    expect(getRegistryValidationErrors()).toEqual([]);
  });

  test("shows non-empty registry sections in the docs navigation", () => {
    expect(getRegistrySectionsWithItems().map((section) => section.id)).toEqual([
      "components",
      "blocks",
      "utilities",
    ]);
  });

  test("has preview snippets for every item", () => {
    for (const item of registryItems) {
      expect(getRegistryItemWithSources(item).previewSourceFile.source).toContain(
        `export function Preview`,
      );
    }
  });

  test("does not publish registry authoring files", () => {
    for (const item of registryItems) {
      expect(item.files.some((file) => file.path.split("/").at(-1)?.startsWith("_"))).toBe(false);
    }
  });

  test("loads source for every published file", () => {
    expect(getMissingRegistrySourcePaths()).toEqual([]);
  });

  test("supports the raw source file types used by registry items", () => {
    expect(getUnsupportedRegistrySourcePaths()).toEqual([]);
    expect(isSupportedRegistrySourcePath("registry/items/example/example.tsx")).toBe(true);
    expect(isSupportedRegistrySourcePath("registry/items/example/example.css")).toBe(true);
    expect(isSupportedRegistrySourcePath("registry/items/example/example.md")).toBe(false);
  });

  test("loads preview source for every item", () => {
    expect(getMissingRegistryPreviewPaths()).toEqual([]);
  });

  test("loads local-only usage state from MDX bodies", () => {
    for (const item of registryItems) {
      expect(item.hasUsage).toBe(true);
    }
  });

  test("normalizes local registry dependencies from frontmatter", () => {
    const block = getRegistryItemByName("stats-panel");

    expect(block.registryDependencies).toContain("badge");
    expect(block.registryDependencies).toContain("card");
    expect(block.registryDependencies).toContain(
      "https://underscore-cn.vercel.app/example-card.json",
    );
    expect(block).not.toHaveProperty("localRegistryDependencies");
  });

  test("loads metadata without evaluating client-only preview imports", () => {
    const hook = getRegistryItemByName("use-copy-to-clipboard");
    const block = getRegistryItemByName("stats-panel");

    expect(hook.previewSourceFile.path).toBe(
      "registry/items/hooks/use-copy-to-clipboard/_registry.mdx",
    );
    expect(block.previewSourceFile.path).toBe("registry/items/blocks/stats-panel/_registry.mdx");
  });

  test("trims blank trailing lines from imported source", () => {
    expect(trimBlankTrailingLines("const value = 1;\n\n \n\t")).toBe("const value = 1;");
    expect(trimBlankTrailingLines("const value = 1;  \n")).toBe("const value = 1;  ");

    for (const item of registryItems) {
      const itemWithSources = getRegistryItemWithSources(item);

      expect(itemWithSources.previewSourceFile.source).not.toMatch(/\n[ \t]*$/u);

      for (const file of itemWithSources.sourceFiles) {
        expect(file.source).not.toMatch(/\n[ \t]*$/u);
      }
    }
  });

  test("rewrites preview source imports to installable aliases for display", () => {
    const item = getRegistryItemWithSources(getRegistryItemByName("example-card"));
    const displaySource = getRegistryDisplaySource(item, item.previewSourceFile);

    expect(displaySource).toContain(`from "@/components/ui/example-card"`);
    expect(displaySource).not.toContain(`from "./example-card"`);
  });

  test("rewrites relative imports between published source files for display", () => {
    const item = {
      sourceFiles: [
        {
          path: "registry/items/components/example/example.tsx",
          type: "registry:ui",
          source: "",
        },
        {
          path: "registry/items/components/example/use-example.ts",
          type: "registry:hook",
          source: "",
        },
      ],
    } as const;
    const displaySource = getRegistryDisplaySource(item, {
      path: "registry/items/components/example/_registry.mdx",
      source: [`import { useExample } from "./use-example";`, `import "./example.css";`].join("\n"),
    });

    expect(displaySource).toContain(`from "@/hooks/use-example"`);
    expect(displaySource).toContain(`import "./example.css";`);
  });

  test("publishes blocks as multi-file registry items", () => {
    const blocks = registryItems.filter((item) => item.type === "registry:block");

    for (const block of blocks) {
      expect(block.files.length).toBeGreaterThan(1);
    }
  });

  test("keeps registry authoring metadata out of preview display source", () => {
    for (const item of registryItems) {
      const itemWithSources = getRegistryItemWithSources(item);

      expect(itemWithSources.previewSourceFile.path.endsWith("_registry.mdx")).toBe(true);
      expect(itemWithSources.previewSourceFile.source).toContain("export function Preview");
      expect(itemWithSources.previewSourceFile.source).not.toContain("registryItem");
      expect(itemWithSources.previewSourceFile.source).not.toContain("---");
    }
  });
});

function getRegistryItemByName(name: string): (typeof registryItems)[number] {
  const item = registryItems.find((registryItem) => registryItem.name === name);

  if (!item) {
    throw new Error(`Missing registry item: ${name}`);
  }

  return item;
}

function getAlphabetizedItemNames(items: Array<{ name: string; title: string }>): string[] {
  return items.toSorted(compareRegistryItemNames).map((item) => item.name);
}

function compareRegistryItemNames(
  a: { name: string; title: string },
  b: { name: string; title: string },
): number {
  return (
    registryItemCollator.compare(a.title, b.title) || registryItemCollator.compare(a.name, b.name)
  );
}

function toRegistryFileDefinition(file: {
  path: string;
  type: string;
  target?: string;
  content: string;
}): { path: string; type: string; target?: string } {
  const { path, type, target } = file;

  if (target) {
    return { path, type, target };
  }

  return { path, type };
}
