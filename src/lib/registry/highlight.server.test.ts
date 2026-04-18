import { describe, expect, test } from "vitest";

import {
  getCodeLanguage,
  highlightCodeToHtml,
  highlightPlainTextToHtml,
} from "@/lib/registry/highlight.server";

describe("registry syntax highlighting", () => {
  test("infers registry source languages from file paths", () => {
    expect(getCodeLanguage("registry/items/components/example-card/example-card.tsx")).toBe("tsx");
    expect(getCodeLanguage("registry/items/hooks/use-example/use-example.ts")).toBe("ts");
    expect(getCodeLanguage("tsx")).toBe("tsx");
    expect(getCodeLanguage("sh")).toBe("bash");
    expect(getCodeLanguage("package.json")).toBe("json");
    expect(getCodeLanguage("registry/items/readme.md")).toBe("text");
  });

  test("highlights TypeScript with dual Shiki themes", async () => {
    const html = await highlightCodeToHtml("export const value = 1;", "example.ts");

    expect(html).toContain("shiki-themes");
    expect(html).toContain("github-light");
    expect(html).toContain("github-dark");
    expect(html).toContain("export");
  });

  test("sets line number width from highlighted line count", async () => {
    const code = Array.from(
      { length: 10 },
      (_, index) => `export const value${index} = ${index};`,
    ).join("\n");
    const html = await highlightCodeToHtml(code, "example.ts");

    expect(html).toContain("--line-number-width:2ch");
  });

  test("escapes fallback plaintext", () => {
    const html = highlightPlainTextToHtml(`<script>"&'</script>`);

    expect(html).toContain("&lt;script&gt;&quot;&amp;&#39;&lt;/script&gt;");
    expect(html).not.toContain(`<script>`);
  });
});
