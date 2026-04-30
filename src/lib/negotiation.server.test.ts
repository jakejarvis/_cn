import { describe, expect, test, vi } from "vitest";

import {
  appendContentNegotiationVaryHeader,
  getContentNegotiationResponseForRequest,
  getRegistryJsonNegotiationResponse,
  getRegistryJsonNegotiationResponseForRequest,
  getMarkdownNegotiationResponse,
  getMarkdownNegotiationResponseForRequest,
  isShadcnRegistryJsonPreferred,
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

const jsonResponse = vi.hoisted(
  () =>
    (json: unknown, status = 200) =>
      Response.json(json, {
        headers: {
          "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
        },
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

vi.mock("./registry/json.server", () => {
  return {
    getRegistryIndexJsonResponse: () =>
      jsonResponse({
        name: "test-registry",
        items: [
          {
            name: "sample-component",
            type: "registry:ui",
          },
        ],
      }),
    getRegistryItemJsonResponse: (name: string) => {
      const itemByName: Record<string, unknown> = {
        index: {
          name: "index",
          type: "registry:block",
        },
        "sample-component": {
          name: "sample-component",
          type: "registry:ui",
        },
        "sample-block": {
          name: "sample-block",
          type: "registry:block",
        },
        "sample-hook": {
          name: "sample-hook",
          type: "registry:hook",
        },
      };

      return itemByName[name]
        ? jsonResponse(itemByName[name])
        : jsonResponse({ error: "Registry item not found." }, 404);
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

  test("adds content negotiation Vary headers to negotiated markdown responses", async () => {
    const response = getMarkdownNegotiationResponseForRequest(
      createRequest("text/markdown"),
      "/docs",
    );

    expect(response?.headers.get("Vary")).toBe("Accept, User-Agent");
    expect(await response?.text()).toContain("# Introduction");
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

describe("shadcn registry JSON negotiation", () => {
  test("detects shadcn CLI registry JSON requests", () => {
    expect(isShadcnRegistryJsonPreferred(createRequest(shadcnAcceptHeader))).toBe(true);
    expect(
      isShadcnRegistryJsonPreferred(createRequest("application/vnd.shadcn.v1+json; q=0")),
    ).toBe(false);
    expect(isShadcnRegistryJsonPreferred(createRequest("application/json"))).toBe(false);
    expect(isShadcnRegistryJsonPreferred(createRequest("text/html"))).toBe(false);
    expect(isShadcnRegistryJsonPreferred(createRequest(undefined, "GET", "shadcn"))).toBe(true);
    expect(isShadcnRegistryJsonPreferred(createRequest(undefined, "GET", "shadcn/4.6.0"))).toBe(
      true,
    );
  });

  test("ignores non-GET requests", () => {
    const request = createRequest(shadcnAcceptHeader, "POST");

    expect(
      getRegistryJsonNegotiationResponseForRequest(request, "/registry/sample-component"),
    ).toBeUndefined();
  });

  test("maps supported human-facing registry URLs to JSON responses", async () => {
    const cases = [
      { path: "/", expected: { name: "index", type: "registry:block" } },
      {
        path: "/registry",
        expected: {
          name: "test-registry",
          items: [
            {
              name: "sample-component",
              type: "registry:ui",
            },
          ],
        },
      },
      { path: "/registry/", expected: { name: "test-registry", items: expect.any(Array) } },
      { path: "/registry/sample-component", expected: { name: "sample-component" } },
      { path: "/components/sample-component", expected: { name: "sample-component" } },
      { path: "/blocks/sample-block", expected: { name: "sample-block" } },
      { path: "/utilities/sample-hook", expected: { name: "sample-hook" } },
    ];

    await Promise.all(
      cases.map(async ({ path, expected }) => {
        const response = getRegistryJsonNegotiationResponse(path);

        expect(response).toBeDefined();
        expect(response?.status).toBe(200);
        expect(response?.headers.get("Content-Type")).toBe("application/json");
        expect(await response?.json()).toEqual(expect.objectContaining(expected));
      }),
    );
  });

  test("adds content negotiation Vary headers to negotiated JSON responses", async () => {
    const request = createRequest(shadcnAcceptHeader);
    const response = getRegistryJsonNegotiationResponseForRequest(
      request,
      "/components/sample-component",
    );

    expect(response?.headers.get("Vary")).toBe("Accept, User-Agent");
    expect(await response?.json()).toEqual(
      expect.objectContaining({
        name: "sample-component",
      }),
    );
  });

  test("does not intercept unsupported or already machine-readable paths", () => {
    for (const path of [
      "/docs",
      "/components",
      "/blocks",
      "/utilities",
      "/registry.json",
      "/r/registry.json",
      "/r/sample-component.json",
      "/registry/sample-component.md",
      "/components/sample-component.png",
      "/missing",
    ]) {
      expect(getRegistryJsonNegotiationResponse(path)).toBeUndefined();
    }
  });

  test("returns JSON 404 responses for missing registry items on supported paths", async () => {
    const missingRegistryItem = getRegistryJsonNegotiationResponse("/registry/missing");
    const missingSectionItem = getRegistryJsonNegotiationResponse("/components/missing");

    expect(missingRegistryItem?.status).toBe(404);
    expect(missingRegistryItem?.headers.get("Content-Type")).toBe("application/json");
    expect(await missingRegistryItem?.json()).toEqual({ error: "Registry item not found." });
    expect(missingSectionItem?.status).toBe(404);
    expect(missingSectionItem?.headers.get("Content-Type")).toBe("application/json");
    expect(await missingSectionItem?.json()).toEqual({ error: "Registry item not found." });
  });

  test("prefers shadcn JSON over markdown when both media types are accepted", async () => {
    const request = createRequest(`${shadcnAcceptHeader}, text/markdown;q=0.8`);
    const response = getContentNegotiationResponseForRequest(request, "/registry/sample-component");

    expect(response?.headers.get("Content-Type")).toBe("application/json");
    expect(await response?.json()).toEqual(
      expect.objectContaining({
        name: "sample-component",
      }),
    );
  });
});

describe("content negotiation Vary headers", () => {
  test("merges Vary headers without duplicates", () => {
    const response = appendContentNegotiationVaryHeader(
      new Response("ok", {
        headers: {
          Vary: "RSC, Accept",
        },
      }),
    );

    expect(response.headers.get("Vary")).toBe("RSC, Accept, User-Agent");
  });
});

const shadcnAcceptHeader = "application/vnd.shadcn.v1+json, application/json;q=0.9";

function createRequest(accept?: string, method = "GET", userAgent?: string): Request {
  return new Request("https://example.com/docs", {
    headers: {
      ...(accept ? { Accept: accept } : {}),
      ...(userAgent ? { "User-Agent": userAgent } : {}),
    },
    method,
  });
}
