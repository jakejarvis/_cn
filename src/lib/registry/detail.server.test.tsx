import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { renderMarkdownCodeBlock } from "@/lib/registry/detail.server";

describe("registry detail rendering", () => {
  test("renders usage code fences with highlighting and copy affordances", async () => {
    const code = `import { ExampleCard } from "@/components/ui/example-card";\n\n<ExampleCard />`;
    const rendered = await renderMarkdownCodeBlock(
      <code className="language-tsx">{`${code}\n`}</code>,
    );

    if (!React.isValidElement<{ code: string; highlightedHtml?: string }>(rendered)) {
      throw new Error("Expected a rendered CodeBlock element.");
    }

    expect(rendered.props.code).toBe(code);
    expect(rendered.props.highlightedHtml).toContain("shiki");

    const html = renderToStaticMarkup(rendered);

    expect(html).toContain("Copy code");
    expect(html).toContain("shiki");
    expect(html).toContain("ExampleCard");
  });
});
