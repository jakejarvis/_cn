import { describe, expect, test } from "vitest";

import {
  createRegistryItemMarkdown,
  createRegistrySectionMarkdown,
  getRegistryItemMarkdown,
  getRegistryItemMarkdownResponse,
  getRegistrySectionMarkdown,
} from "@/lib/registry/markdown.server";
import { registrySectionList } from "@/lib/registry/section-config";
import { getRegistrySectionItems, getRegistrySectionsWithItems } from "@/lib/registry/sections";
import { getMarkdownHttpLinkHeader } from "@/lib/seo";
import { getCanonicalDocsUrl, getCanonicalRegistryItemUrl } from "@/lib/site-config";

const fixtureSection = {
  title: "Components",
  description: "Reusable UI components.",
  basePath: "/components",
} as const;

const fixtureItem = {
  name: "alpha-card",
  title: "Alpha Card",
  description: "A compact card component.",
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
  test("builds section markdown with supplied linked registry items", () => {
    const markdown = createRegistrySectionMarkdown(fixtureSection, [fixtureItem]);

    expect(markdown).toContain("# Components");
    expect(markdown).toContain("Reusable UI components.");
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
    expect(markdown).toContain("### registry/items/components/alpha-card/alpha-card.tsx");
    expect(markdown).toContain(`from "@/components/ui/alpha-card"`);
    expect(markdown).toContain("## Usage");
  });

  test("builds live section markdown without requiring starter items", () => {
    for (const section of registrySectionList) {
      const markdown = getRegistrySectionMarkdown(section.id);
      const items = getRegistrySectionItems(section.id);

      expect(markdown).toContain(`# ${section.title}`);
      expect(markdown).toContain(section.description);

      for (const item of items) {
        expect(markdown).toContain(getCanonicalDocsUrl(`${section.basePath}/${item.name}`));
      }
    }
  });

  test("returns null when an item is missing or outside the section type", () => {
    expect(getRegistryItemMarkdown("components", "missing-item")).toBeNull();

    for (const section of getRegistrySectionsWithItems()) {
      for (const otherSection of registrySectionList) {
        if (otherSection.id !== section.id) {
          expect(getRegistryItemMarkdown(otherSection.id, section.items[0].name)).toBeNull();
          return;
        }
      }
    }
  });

  test("returns markdown and 404 responses with markdown content type", async () => {
    const itemResponses = await Promise.all(
      getRegistrySectionsWithItems().flatMap((section) =>
        section.items.map(async (item) => {
          const found = getRegistryItemMarkdownResponse(section.id, item.name);
          const text = await found.text();

          return { found, item, section, text };
        }),
      ),
    );

    for (const { found, item, section, text } of itemResponses) {
      expect(found.status).toBe(200);
      expect(found.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
      expect(found.headers.get("Link")).toBe(
        getMarkdownHttpLinkHeader(`${section.basePath}/${item.name}`),
      );
      expect(text).toContain(`# ${item.title}`);
    }

    const missing = getRegistryItemMarkdownResponse("components", "missing-item");

    expect(missing.status).toBe(404);
    expect(missing.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
  });
});
