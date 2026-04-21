import { describe, expect, test } from "vitest";

import { getPrerenderPages } from "@/lib/prerender-pages";
import { shouldExcludeFromSitemap } from "@/lib/seo";

describe("prerender pages", () => {
  test("enumerates HTML, Markdown, LLM, robots, and registry JSON routes", () => {
    const pages = getPrerenderPages();
    const paths = pages.map((page) => page.path);

    expect(paths).toEqual([...new Set(paths)]);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/",
        "/docs",
        "/docs/installation",
        "/docs/installation.md",
        "/components",
        "/components.md",
        "/components/example-card",
        "/components/example-card.md",
        "/blocks",
        "/blocks.md",
        "/blocks/stats-panel",
        "/blocks/stats-panel.md",
        "/utilities",
        "/utilities.md",
        "/utilities/use-copy-to-clipboard",
        "/utilities/use-copy-to-clipboard.md",
        "/registry.json",
        "/r/registry.json",
        "/r/example-card.json",
        "/r/stats-panel.json",
        "/r/use-copy-to-clipboard.json",
        "/llms.txt",
        "/llms-full.txt",
        "/robots.txt",
      ]),
    );
    expect(paths).not.toContain("/components/");
    expect(paths).not.toContain("/example-card.json");
    expect(paths).not.toContain("/stats-panel.json");
    expect(paths).not.toContain("/use-copy-to-clipboard.json");
  });

  test("marks machine-readable prerender pages as sitemap-excluded", () => {
    for (const page of getPrerenderPages()) {
      expect(page.sitemap?.exclude === true).toBe(shouldExcludeFromSitemap(page.path));
    }
  });
});
