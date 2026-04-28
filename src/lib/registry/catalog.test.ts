import { describe, expect, test } from "vitest";

import {
  getRegistryCatalogWithItems,
  getRegistryItemsByTypes,
  registryMetadataItems,
  registryItems,
} from "./catalog";
import { getRegistryDisplaySource } from "./display-source.server";
import { publicRegistryItemTypes } from "./item-types";
import {
  getRegistryIndexJson,
  getRegistryItemJson,
  getRegistryValidationErrors,
} from "./json.server";
import { registryItemSchema } from "./metadata";
import { isSupportedRegistrySourcePath } from "./source-types";
import {
  getMissingRegistryPreviewPaths,
  getMissingRegistrySourcePaths,
  getRegistryItemWithSources,
  getUnsupportedRegistrySourcePaths,
  trimBlankTrailingLines,
} from "./source.server";

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

    for (const types of [
      ["registry:ui", "registry:component"] as const,
      ["registry:block"] as const,
    ]) {
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
      expect(registryItemJson?.files?.map(toRegistryFileDefinition) ?? []).toEqual(item.files);
      expect(registryItemJson?.files?.every((file) => file.content.length > 0) ?? true).toBe(true);
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

  test("builds one grouped registry catalog for docs navigation", () => {
    const catalog = getRegistryCatalogWithItems();

    expect(catalog.id).toBe("registry");
    expect(catalog.items).toEqual(registryItems);
    expect(catalog.groups.map((group) => group.type)).toEqual(
      publicRegistryItemTypes.filter((type) => getRegistryItemsByTypes([type]).length > 0),
    );
  });

  test("loads preview snippets when items define previews", () => {
    for (const item of registryItems) {
      const source = getRegistryItemWithSources(item).previewSourceFile.source;

      if (item.hasPreview) {
        expect(source).toContain(`export function Preview`);
      } else {
        expect(source).toBe("");
      }
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
    expect(isSupportedRegistrySourcePath("registry/items/example/example.md")).toBe(true);
    expect(isSupportedRegistrySourcePath("registry/items/example/.env")).toBe(true);
  });

  test("loads preview source for every item", () => {
    expect(getMissingRegistryPreviewPaths()).toEqual([]);
  });

  test("loads local-only usage state from MDX bodies", () => {
    for (const item of registryItems) {
      expect(typeof item.hasUsage).toBe("boolean");
      expect(item.hasUsage).toBe(item.usageSource.trim().length > 0);
    }
  });

  test("loads metadata without evaluating client-only preview imports", () => {
    for (const item of registryItems) {
      expect(item.previewSourceFile.path).toMatch(/\/_registry\.mdx$/u);
      if (item.hasPreview) {
        expect(item.previewSourceFile.source).toContain("export function Preview");
      }
    }
  });

  test("trims blank trailing lines from imported source", () => {
    expect(trimBlankTrailingLines("const value = 1;\n\n \n\t")).toBe("const value = 1;");
    expect(trimBlankTrailingLines("const value = 1;  \n")).toBe("const value = 1;  ");

    for (const item of registryItems) {
      const itemWithSources = getRegistryItemWithSources(item);

      if (item.hasPreview) {
        expect(itemWithSources.previewSourceFile.source).not.toMatch(/\n[ \t]*$/u);
      }

      for (const file of itemWithSources.sourceFiles) {
        expect(file.source).not.toMatch(/\n[ \t]*$/u);
      }
    }
  });

  test("rewrites preview source imports to installable aliases for display", () => {
    const item = {
      sourceFiles: [
        {
          path: "registry/items/components/alpha-card/alpha-card.tsx",
          type: "registry:ui",
          source: "",
        },
      ],
    } as const;
    const displaySource = getRegistryDisplaySource(
      item,
      {
        path: "registry/items/components/alpha-card/_registry.mdx",
        source: `import { AlphaCard } from "./alpha-card";`,
      },
      { registryItems: [] },
    );

    expect(displaySource).toContain(`from "@/components/ui/alpha-card"`);
    expect(displaySource).not.toContain(`from "./alpha-card"`);
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
    const displaySource = getRegistryDisplaySource(
      item,
      {
        path: "registry/items/components/example/_registry.mdx",
        source: [`import { useExample } from "./use-example";`, `import "./example.css";`].join(
          "\n",
        ),
      },
      { registryItems: [] },
    );

    expect(displaySource).toContain(`from "@/hooks/use-example"`);
    expect(displaySource).toContain(`import "./example.css";`);
  });

  test("keeps registry authoring metadata out of preview display source", () => {
    for (const item of registryItems) {
      const itemWithSources = getRegistryItemWithSources(item);

      if (!item.hasPreview) {
        continue;
      }

      expect(itemWithSources.previewSourceFile.path.endsWith("_registry.mdx")).toBe(true);
      expect(itemWithSources.previewSourceFile.source).toContain("export function Preview");
      expect(itemWithSources.previewSourceFile.source).not.toContain("registryItem");
      expect(itemWithSources.previewSourceFile.source).not.toContain("---");
    }
  });
});

function getAlphabetizedItemNames(items: { name: string; title?: string }[]): string[] {
  return items.toSorted(compareRegistryItemNames).map((item) => item.name);
}

function compareRegistryItemNames(
  a: { name: string; title?: string },
  b: { name: string; title?: string },
): number {
  return (
    registryItemCollator.compare(a.title ?? a.name, b.title ?? b.name) ||
    registryItemCollator.compare(a.name, b.name)
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
