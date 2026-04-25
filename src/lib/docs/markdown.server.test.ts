import { describe, expect, test } from "vitest";

import { getMarkdownHttpLinkHeader } from "../seo";
import { getCanonicalDocsUrl } from "../site-config";
import { docsPages } from "./catalog";
import {
  createAuthoredDocsIndexMarkdown,
  createAuthoredDocsPageMarkdown,
  getAuthoredDocsPageMarkdown,
  getAuthoredDocsPageMarkdownResponse,
} from "./markdown.server";

describe("authored docs markdown", () => {
  test("builds docs index markdown with supplied linked pages", () => {
    const markdown = createAuthoredDocsIndexMarkdown([
      {
        title: "Getting Started",
        description: "Install the registry.",
        routePath: "/docs/getting-started",
      },
    ]);

    expect(markdown).toContain("# Docs");
    expect(markdown).toContain(
      `- [Getting Started](${getCanonicalDocsUrl("/docs/getting-started")}): Install the registry.`,
    );
  });

  test("returns supplied docs markdown without frontmatter", () => {
    expect(
      createAuthoredDocsPageMarkdown({
        title: "Getting Started",
        description: "Install the registry.",
        contentSource: "# Getting Started\n\nRun the install command.",
      }),
    ).toBe("# Getting Started\n\nRun the install command.\n");

    expect(
      createAuthoredDocsPageMarkdown({
        title: "Theming",
        description: "Customize tokens.",
        contentSource: "Use CSS variables.",
      }),
    ).toBe("# Theming\n\nCustomize tokens.\n\nUse CSS variables.\n");
  });

  test("returns live authored docs markdown without requiring starter slugs", () => {
    for (const page of docsPages) {
      const markdown = getAuthoredDocsPageMarkdown(page.slug);

      expect(markdown).not.toBeNull();
      expect(markdown).not.toContain(`title: ${page.title}`);
    }
  });

  test("returns markdown and 404 responses with markdown content type", () => {
    for (const page of docsPages) {
      const found = getAuthoredDocsPageMarkdownResponse(page.slug);

      expect(found.status).toBe(200);
      expect(found.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
      expect(found.headers.get("Link")).toBe(getMarkdownHttpLinkHeader(page.routePath));
    }

    const missing = getAuthoredDocsPageMarkdownResponse("missing");

    expect(missing.status).toBe(404);
    expect(missing.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
  });
});
