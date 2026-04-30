import { describe, expect, test, vi } from "vitest";

import {
  getMarkdownNegotiationResponse,
  getMarkdownNegotiationResponseForRequest,
  isMarkdownPreferred,
} from "./negotiation.server";

const markdownResponse = vi.hoisted(
  () =>
    (markdown: string, status = 200) =>
      new Response(markdown, {
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
        status,
      }),
);

vi.mock("./docs/markdown.server", () => {
  return {
    getAuthoredDocsPageMarkdownResponse: (slug: string) => {
      const markdownBySlug: Record<string, string> = {
        "": "# Introduction",
        guide: "# Guide",
      };

      return markdownBySlug[slug]
        ? markdownResponse(markdownBySlug[slug])
        : markdownResponse("Docs page not found.", 404);
    },
  };
});

vi.mock("./registry/markdown.server", () => {
  return {
    getRegistryCatalogMarkdownResponse: () => markdownResponse("# Registry"),
    getRegistryItemMarkdownResponse: (name: string) =>
      name === "sample-component"
        ? markdownResponse("# Sample Component")
        : markdownResponse("Registry item not found.", 404),
    getRegistrySectionMarkdownResponse: (section: string) => {
      const markdownBySection: Record<string, string> = {
        components: "# Components",
        blocks: "# Blocks",
        utilities: "# Utilities",
      };

      return markdownBySection[section]
        ? markdownResponse(markdownBySection[section])
        : markdownResponse("Registry section not found.", 404);
    },
    getRegistrySectionItemMarkdownResponse: (section: string, name: string) => {
      const markdownBySectionItem: Record<string, string> = {
        "components:sample-component": "# Sample Component",
        "blocks:sample-block": "# Sample Block",
        "utilities:sample-hook": "# Sample Hook",
      };
      const markdown = markdownBySectionItem[`${section}:${name}`];

      return markdown
        ? markdownResponse(markdown)
        : markdownResponse("Registry item not found.", 404);
    },
  };
});

describe("markdown negotiation", () => {
  test("detects Fumadocs-like markdown Accept headers", () => {
    for (const mediaType of ["text/plain", "text/markdown", "text/x-markdown"]) {
      expect(isMarkdownPreferred(createRequest(mediaType))).toBe(true);
    }

    expect(isMarkdownPreferred(createRequest("TEXT/MARKDOWN"))).toBe(true);
    expect(isMarkdownPreferred(createRequest("text/html, text/plain"))).toBe(true);
    expect(isMarkdownPreferred(createRequest("text/markdown; q=0"))).toBe(false);
    expect(isMarkdownPreferred(createRequest("text/html, application/xhtml+xml"))).toBe(false);
    expect(isMarkdownPreferred(createRequest("text/html, application/xhtml+xml, */*;q=0.8"))).toBe(
      false,
    );
    expect(isMarkdownPreferred(createRequest())).toBe(false);
  });

  test("ignores non-GET requests", () => {
    const request = createRequest("text/markdown", "POST");

    expect(getMarkdownNegotiationResponseForRequest(request, "/docs")).toBeUndefined();
  });

  test("maps supported docs and registry pages to markdown responses", async () => {
    const cases = [
      { path: "/docs", expected: "# Introduction" },
      { path: "/docs/", expected: "# Introduction" },
      { path: "/docs/guide", expected: "# Guide" },
      { path: "/registry", expected: "# Registry" },
      { path: "/registry/sample-component", expected: "# Sample Component" },
      { path: "/components", expected: "# Components" },
      { path: "/components/sample-component", expected: "# Sample Component" },
      { path: "/blocks", expected: "# Blocks" },
      { path: "/blocks/sample-block", expected: "# Sample Block" },
      { path: "/utilities", expected: "# Utilities" },
      { path: "/utilities/sample-hook", expected: "# Sample Hook" },
    ];

    await Promise.all(
      cases.map(async ({ path, expected }) => {
        const response = getMarkdownNegotiationResponse(path);

        expect(response).toBeDefined();
        expect(response?.status).toBe(200);
        expect(response?.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
        expect(await response?.text()).toContain(expected);
      }),
    );
  });

  test("does not intercept machine-readable or asset paths", () => {
    for (const path of [
      "/",
      "/registry.md",
      "/DOCS",
      "/registry/sample-component.md",
      "/components/sample-component.md",
      "/llms.txt",
      "/registry.json",
      "/r/registry.json",
      "/robots.txt",
      "/favicon.svg",
      "/registry/sample-component.png",
    ]) {
      expect(getMarkdownNegotiationResponse(path)).toBeUndefined();
    }
  });

  test("returns markdown 404 responses for missing supported content", () => {
    const missingDocs = getMarkdownNegotiationResponse("/docs/missing");
    const missingRegistryItem = getMarkdownNegotiationResponse("/registry/missing");
    const missingSectionItem = getMarkdownNegotiationResponse("/components/missing");
    const wrongSectionItem = getMarkdownNegotiationResponse("/blocks/sample-component");

    expect(missingDocs?.status).toBe(404);
    expect(missingDocs?.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
    expect(missingRegistryItem?.status).toBe(404);
    expect(missingRegistryItem?.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
    expect(missingSectionItem?.status).toBe(404);
    expect(missingSectionItem?.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
    expect(wrongSectionItem?.status).toBe(404);
    expect(wrongSectionItem?.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
    expect(getMarkdownNegotiationResponse("/missing")).toBeUndefined();
  });
});

function createRequest(accept?: string, method = "GET"): Request {
  return new Request("https://example.com/docs", {
    headers: accept ? { Accept: accept } : undefined,
    method,
  });
}
