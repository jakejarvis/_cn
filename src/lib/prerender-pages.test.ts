import { describe, expect, test } from "vitest";

import { docsPages } from "@/lib/docs/catalog";
import { createPrerenderPages, getPrerenderPages } from "@/lib/prerender-pages";
import { registryItems } from "@/lib/registry/catalog";
import { registrySectionList } from "@/lib/registry/sections";
import { shouldExcludeFromSitemap } from "@/lib/seo";
import {
  getAliasRegistryIndexPaths,
  getAliasRegistryItemPaths,
  getCanonicalRegistryIndexPath,
  getCanonicalRegistryItemPath,
  getDocsMarkdownPath,
} from "@/lib/site-config";

describe("prerender pages", () => {
  test("enumerates routes for supplied docs and registry items", () => {
    const pages = createPrerenderPages({
      docsPagePaths: ["/docs", "/docs/getting-started"],
      registryItems: [
        { name: "alpha-card", type: "registry:ui" },
        { name: "stats-grid", type: "registry:block" },
        { name: "use-clipboard", type: "registry:hook" },
      ],
    });
    const paths = pages.map((page) => page.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        "/",
        "/docs",
        "/docs.md",
        "/docs/getting-started",
        "/docs/getting-started.md",
        "/components/alpha-card",
        "/components/alpha-card.md",
        "/blocks/stats-grid",
        "/blocks/stats-grid.md",
        "/utilities/use-clipboard",
        "/utilities/use-clipboard.md",
        "/r/alpha-card.json",
        "/r/stats-grid.json",
        "/r/use-clipboard.json",
        "/llms.txt",
        "/llms-full.txt",
        "/robots.txt",
      ]),
    );
  });

  test("enumerates live HTML, Markdown, LLM, robots, and registry JSON routes", () => {
    const pages = getPrerenderPages();
    const paths = pages.map((page) => page.path);

    expect(paths).toEqual([...new Set(paths)]);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/",
        getCanonicalRegistryIndexPath(),
        ...getAliasRegistryIndexPaths(),
        "/llms.txt",
        "/llms-full.txt",
        "/robots.txt",
      ]),
    );

    for (const section of registrySectionList) {
      expect(paths).toContain(section.basePath);
      expect(paths).toContain(getDocsMarkdownPath(section.basePath));
    }

    for (const page of docsPages) {
      expect(paths).toContain(page.routePath);
      expect(paths).toContain(getDocsMarkdownPath(page.routePath));
    }

    for (const item of registryItems) {
      expect(paths).toContain(getCanonicalRegistryItemPath(item.name));

      for (const aliasPath of getAliasRegistryItemPaths(item.name)) {
        expect(paths).toContain(aliasPath);
      }

      const section = registrySectionList.find((candidate) =>
        candidate.registryTypes.some((registryType) => registryType === item.type),
      );

      if (section) {
        const itemPath = `${section.basePath}/${item.name}`;

        expect(paths).toContain(itemPath);
        expect(paths).toContain(getDocsMarkdownPath(itemPath));
      }
    }

    expect(paths.filter((path) => path !== "/").every((path) => !path.endsWith("/"))).toBe(true);
  });

  test("marks machine-readable prerender pages as sitemap-excluded", () => {
    for (const page of getPrerenderPages()) {
      expect(page.sitemap?.exclude === true).toBe(shouldExcludeFromSitemap(page.path));
    }
  });
});
