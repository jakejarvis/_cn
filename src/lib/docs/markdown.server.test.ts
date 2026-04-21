import { describe, expect, test } from "vitest";

import {
  getAuthoredDocsIndexMarkdown,
  getAuthoredDocsPageMarkdown,
  getAuthoredDocsPageMarkdownResponse,
} from "@/lib/docs/markdown.server";

describe("authored docs markdown", () => {
  test("builds docs index markdown with linked pages", () => {
    const markdown = getAuthoredDocsIndexMarkdown();

    expect(markdown).toContain("# Docs");
    expect(markdown).toContain(
      "- [Installation](https://underscore-cn.vercel.app/docs/installation):",
    );
  });

  test("returns authored docs markdown without frontmatter", () => {
    const markdown = getAuthoredDocsPageMarkdown("installation");

    expect(markdown).not.toBeNull();
    expect(markdown).toContain("# Installation");
    expect(markdown).not.toContain("title: Installation");
    expect(markdown).toContain("vp install");
  });

  test("returns markdown and 404 responses with markdown content type", async () => {
    const found = getAuthoredDocsPageMarkdownResponse("installation");
    const missing = getAuthoredDocsPageMarkdownResponse("missing");

    expect(found.status).toBe(200);
    expect(found.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
    expect(found.headers.get("Link")).toBe(
      '<https://underscore-cn.vercel.app/docs/installation>; rel="canonical", <https://underscore-cn.vercel.app/docs/installation.md>; rel="alternate"; type="text/markdown"',
    );
    expect(await found.text()).toContain("# Installation");
    expect(missing.status).toBe(404);
    expect(missing.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
  });
});
