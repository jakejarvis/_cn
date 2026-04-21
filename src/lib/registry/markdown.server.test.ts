import { describe, expect, test } from "vitest";

import {
  getRegistryItemMarkdown,
  getRegistryItemMarkdownResponse,
  getRegistrySectionMarkdown,
} from "@/lib/registry/markdown.server";

describe("docs markdown", () => {
  test("builds section markdown with linked registry items", () => {
    const markdown = getRegistrySectionMarkdown("components");

    expect(markdown).toContain("# Components");
    expect(markdown).toContain("Reusable UI components you can install into your project.");
    expect(markdown).toContain(
      "- [Example Card](https://underscore-cn.vercel.app/components/example-card):",
    );
  });

  test("builds item markdown with install command, preview, sources, and usage", () => {
    const markdown = getRegistryItemMarkdown("components", "example-card");

    expect(markdown).not.toBeNull();
    expect(markdown).toContain("# Example Card");
    expect(markdown).toContain("## Installation");
    expect(markdown).toContain(
      "npx shadcn@latest add https://underscore-cn.vercel.app/example-card.json",
    );
    expect(markdown).toContain(
      "[Registry JSON](https://underscore-cn.vercel.app/example-card.json)",
    );
    expect(markdown).toContain("## Preview");
    expect(markdown).toContain("## Source");
    expect(markdown).toContain("### registry/items/components/example-card/example-card.tsx");
    expect(markdown).toContain(`from "@/components/ui/example-card"`);
    expect(markdown).toContain("## Usage");
  });

  test("returns null when an item is missing or outside the section type", () => {
    expect(getRegistryItemMarkdown("components", "missing-item")).toBeNull();
    expect(getRegistryItemMarkdown("components", "stats-panel")).toBeNull();
  });

  test("returns markdown and 404 responses with markdown content type", async () => {
    const found = getRegistryItemMarkdownResponse("components", "example-card");
    const missing = getRegistryItemMarkdownResponse("components", "missing-item");

    expect(found.status).toBe(200);
    expect(found.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
    expect(await found.text()).toContain("# Example Card");
    expect(missing.status).toBe(404);
    expect(missing.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
  });
});
