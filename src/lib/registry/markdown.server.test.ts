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
} from "./markdown.server";

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
      path: "registry/items/components/alpha-card/alpha-card.tsx",
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
    const markdown = createRegistryCatalogMarkdown(fixtureCatalog, [fixtureItem]);

    expect(markdown).toContain("# Registry");
    expect(markdown).toContain("Installable items.");
    expect(markdown).toContain(
      `- [Alpha Card](${getCanonicalDocsUrl("/registry/alpha-card")}): A compact card component.`,
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
    expect(markdown).toContain("### registry/items/components/alpha-card/alpha-card.tsx");
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
      expect(markdown).toContain(getCanonicalDocsUrl(`${registryCatalog.basePath}/${item.name}`));
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
        getMarkdownHttpLinkHeader(`${registryCatalog.basePath}/${item.name}`),
      );
      expect(text).toContain(`# ${item.title}`);
    }

    const catalogResponse = getRegistryCatalogMarkdownResponse();
    const missing = getRegistryItemMarkdownResponse("missing-item");

    expect(catalogResponse.status).toBe(200);
    expect(catalogResponse.headers.get("Link")).toBe(
      getMarkdownHttpLinkHeader(registryCatalog.basePath),
    );
    expect(missing.status).toBe(404);
    expect(missing.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
  });
});
