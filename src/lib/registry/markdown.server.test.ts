import { describe, expect, test } from "vitest";

import { getMarkdownHttpLinkHeader } from "../seo";
import { getCanonicalDocsUrl, getCanonicalRegistryItemUrl } from "../site-config";
import { getRegistryCatalogWithItems, registryItems } from "./catalog";
import { registryCatalog } from "./item-types";
import {
  createRegistryCatalogMarkdown,
  createRegistryItemMarkdown,
  getRegistryCatalogMarkdown,
  getRegistryCatalogMarkdownResponse,
  getRegistryItemMarkdown,
  getRegistryItemMarkdownResponse,
  getRegistrySectionItemMarkdownResponse,
  getRegistrySectionMarkdownResponse,
} from "./markdown.server";
import {
  getRegistryItemRoutePath,
  getRegistrySectionIdForType,
  getRegistrySectionsWithItems,
  registrySectionList,
} from "./sections";

const fixtureCatalog = {
  title: "Registry",
  description: "Installable items.",
  basePath: "/registry",
} as const;

const fixtureItem = {
  name: "alpha-card",
  title: "Alpha Card",
  description: "A compact card component.",
  hasPreview: true,
  previewSourceFile: {
    path: "registry/items/components/alpha-card/_registry.mdx",
    fileName: "_registry.mdx",
    source: `import { AlphaCard } from "./alpha-card";

export function Preview() {
  return <AlphaCard />;
}`,
  },
  sourceFiles: [
    {
      path: "ui/alpha-card.tsx",
      sourcePath: "registry/items/components/alpha-card/alpha-card.tsx",
      fileName: "alpha-card.tsx",
      type: "registry:ui" as const,
      source: `export function AlphaCard() {
  return <div>Alpha</div>;
}`,
    },
  ],
  usageSource: `\`\`\`tsx
import { AlphaCard } from "@/components/ui/alpha-card";
\`\`\``,
};

describe("registry markdown", () => {
  test("builds catalog markdown with supplied linked registry items", () => {
    const markdown = createRegistryCatalogMarkdown(fixtureCatalog, [
      { ...fixtureItem, routePath: "/components/alpha-card" },
    ]);

    expect(markdown).toContain("# Registry");
    expect(markdown).toContain("Installable items.");
    expect(markdown).toContain(
      `- [Alpha Card](${getCanonicalDocsUrl("/components/alpha-card")}): A compact card component.`,
    );
  });

  test("builds item markdown with install command, preview, sources, and usage", () => {
    const markdown = createRegistryItemMarkdown(fixtureItem);

    expect(markdown).toContain("# Alpha Card");
    expect(markdown).toContain("## Installation");
    expect(markdown).toContain(
      `npx shadcn@latest add ${getCanonicalRegistryItemUrl("alpha-card")}`,
    );
    expect(markdown).toContain(`[Registry JSON](${getCanonicalRegistryItemUrl("alpha-card")})`);
    expect(markdown).toContain("## Preview");
    expect(markdown).toContain("## Source");
    expect(markdown).toContain("### ui/alpha-card.tsx");
    expect(markdown).toContain(`from "@/components/ui/alpha-card"`);
    expect(markdown).toContain("## Usage");
  });

  test("omits preview and source sections for metadata-only items", () => {
    const markdown = createRegistryItemMarkdown({
      name: "custom-theme",
      title: "Custom Theme",
      description: "A metadata-only theme.",
      hasPreview: false,
      previewSourceFile: {
        path: "registry/items/themes/custom-theme/_registry.mdx",
        fileName: "_registry.mdx",
        source: "",
      },
      sourceFiles: [],
      usageSource: "",
    });

    expect(markdown).toContain("# Custom Theme");
    expect(markdown).toContain("## Installation");
    expect(markdown).not.toContain("## Preview");
    expect(markdown).not.toContain("## Source");
  });

  test("builds live catalog markdown without requiring starter items", () => {
    const markdown = getRegistryCatalogMarkdown();
    const catalog = getRegistryCatalogWithItems();

    expect(markdown).toContain(`# ${registryCatalog.title}`);
    expect(markdown).toContain(registryCatalog.description);

    for (const item of catalog.items) {
      expect(markdown).toContain(getCanonicalDocsUrl(getRegistryItemRoutePath(item)));
    }
  });

  test("uses public install import paths in supplied usage examples", () => {
    const usageFixtures = [
      {
        item: fixtureItem,
        expectedImport: `import { AlphaCard } from "@/components/ui/alpha-card";`,
      },
      {
        item: {
          name: "metrics-panel",
          title: "Metrics Panel",
          description: "A dashboard metrics block.",
          hasPreview: false,
          previewSourceFile: {
            path: "registry/items/blocks/metrics-panel/_registry.mdx",
            fileName: "_registry.mdx",
            source: "",
          },
          sourceFiles: [
            {
              path: "components/metrics-panel.tsx",
              sourcePath: "registry/items/blocks/metrics-panel/metrics-panel.tsx",
              fileName: "metrics-panel.tsx",
              type: "registry:component" as const,
              source: `export function MetricsPanel() {
  return <div>Metrics</div>;
}`,
            },
          ],
          usageSource: `\`\`\`tsx
import { MetricsPanel } from "@/components/metrics-panel";
\`\`\``,
        },
        expectedImport: `import { MetricsPanel } from "@/components/metrics-panel";`,
      },
      {
        item: {
          name: "use-alpha-state",
          title: "useAlphaState",
          description: "A small state hook.",
          hasPreview: false,
          previewSourceFile: {
            path: "registry/items/hooks/use-alpha-state/_registry.mdx",
            fileName: "_registry.mdx",
            source: "",
          },
          sourceFiles: [
            {
              path: "hooks/use-alpha-state.ts",
              sourcePath: "registry/items/hooks/use-alpha-state/use-alpha-state.ts",
              fileName: "use-alpha-state.ts",
              type: "registry:hook" as const,
              source: `export function useAlphaState() {
  return "alpha";
}`,
            },
          ],
          usageSource: `\`\`\`tsx
import { useAlphaState } from "@/hooks/use-alpha-state";
\`\`\``,
        },
        expectedImport: `import { useAlphaState } from "@/hooks/use-alpha-state";`,
      },
    ];

    for (const { item, expectedImport } of usageFixtures) {
      expect(createRegistryItemMarkdown(item)).toContain(expectedImport);
    }
  });

  test("returns null when an item is missing", () => {
    expect(getRegistryItemMarkdown("missing-item")).toBeNull();
  });

  test("returns markdown and 404 responses with markdown content type", async () => {
    const itemResponses = await Promise.all(
      registryItems.map(async (item) => {
        const found = getRegistryItemMarkdownResponse(item.name);
        const text = await found.text();

        return { found, item, text };
      }),
    );

    for (const { found, item, text } of itemResponses) {
      expect(found.status).toBe(200);
      expect(found.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
      expect(found.headers.get("Link")).toBe(
        getMarkdownHttpLinkHeader(getRegistryItemRoutePath(item)),
      );
      expect(text).toContain(`# ${item.title}`);
    }

    const catalogResponse = getRegistryCatalogMarkdownResponse();
    const sectionResponses = await Promise.all(
      getRegistrySectionsWithItems(registryItems).map(async (section) => {
        const found = getRegistrySectionMarkdownResponse(section.id);
        const text = await found.text();

        return { found, section, text };
      }),
    );
    const sectionItemResponses = await Promise.all(
      registryItems.map(async (item) => {
        const found = getRegistrySectionItemMarkdownResponse(
          getRegistrySectionIdForType(item.type),
          item.name,
        );
        const text = await found.text();

        return { found, item, text };
      }),
    );
    const missing = getRegistryItemMarkdownResponse("missing-item");

    expect(catalogResponse.status).toBe(200);
    expect(catalogResponse.headers.get("Link")).toBe(
      getMarkdownHttpLinkHeader(registryCatalog.basePath),
    );

    for (const { found, section, text } of sectionResponses) {
      expect(found.status).toBe(200);
      expect(found.headers.get("Link")).toBe(getMarkdownHttpLinkHeader(section.basePath));
      expect(text).toContain(`# ${section.title}`);
    }

    for (const { found, item, text } of sectionItemResponses) {
      expect(found.status).toBe(200);
      expect(found.headers.get("Link")).toBe(
        getMarkdownHttpLinkHeader(getRegistryItemRoutePath(item)),
      );
      expect(text).toContain(`# ${item.title}`);
    }

    expect(missing.status).toBe(404);
    expect(missing.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
    expect(getRegistrySectionMarkdownResponse("missing").status).toBe(404);

    const firstItem = registryItems[0];
    if (!firstItem) {
      throw new Error("Expected at least one registry item");
    }

    const wrongSection = registrySectionList.find(
      (section) => section.id !== getRegistrySectionIdForType(firstItem.type),
    );
    if (!wrongSection) {
      throw new Error("Expected at least one registry section outside the first item section");
    }

    expect(getRegistrySectionItemMarkdownResponse(wrongSection.id, firstItem.name).status).toBe(
      404,
    );
  });
});
