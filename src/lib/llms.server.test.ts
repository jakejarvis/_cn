import { describe, expect, test } from "vitest";

import {
  getLlmsFullText,
  getLlmsFullTextResponse,
  getLlmsText,
  getLlmsTextResponse,
} from "@/lib/llms.server";

describe("llms text", () => {
  test("builds a site-level llms.txt index with markdown routes", () => {
    const text = getLlmsText();

    expect(text).toContain("# _cn");
    expect(text).toContain(
      "> A TanStack Start template for publishing a shadcn-compatible registry.",
    );
    expect(text).toContain(
      "- [Introduction](https://underscore-cn.vercel.app/docs.md): Publish installable components with public docs from the same registry workspace.",
    );
    expect(text).toContain(
      "- [Example Card](https://underscore-cn.vercel.app/components/example-card.md):",
    );
    expect(text).toContain(
      "- [Registry JSON](https://underscore-cn.vercel.app/registry.json): Machine-readable shadcn registry index.",
    );
  });

  test("builds a full context file from generated markdown pages", () => {
    const text = getLlmsFullText();

    expect(text).toContain("# _cn Full Context");
    expect(text).toContain("URL: https://underscore-cn.vercel.app/docs.md");
    expect(text).toContain("# Introduction");
    expect(text).toContain("URL: https://underscore-cn.vercel.app/components/example-card.md");
    expect(text).toContain("## Installation");
    expect(text).toContain("## Source");
  });

  test("returns text responses with cache headers", async () => {
    const index = getLlmsTextResponse();
    const full = getLlmsFullTextResponse();

    expect(index.status).toBe(200);
    expect(index.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(await index.text()).toContain("/llms-full.txt");
    expect(full.status).toBe(200);
    expect(full.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(await full.text()).toContain("/llms.txt");
  });
});
