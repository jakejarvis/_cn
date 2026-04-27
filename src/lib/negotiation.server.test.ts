import { describe, expect, test } from "vitest";

import {
  getMarkdownNegotiationResponse,
  getMarkdownNegotiationResponseForRequest,
  isMarkdownPreferred,
} from "./negotiation.server";

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
      { path: "/docs/agents", expected: "# Agents" },
      { path: "/components", expected: "# Components" },
      { path: "/components/example-card", expected: "# Example Card" },
      { path: "/blocks", expected: "# Blocks" },
      { path: "/blocks/stats-panel", expected: "# Stats Panel" },
      { path: "/utilities", expected: "# Utilities" },
      { path: "/utilities/use-copy-to-clipboard", expected: "# useCopyToClipboard" },
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
      "/components.md",
      "/DOCS",
      "/components/example-card.md",
      "/llms.txt",
      "/registry.json",
      "/r/registry.json",
      "/robots.txt",
      "/favicon.svg",
      "/components/example-card.png",
    ]) {
      expect(getMarkdownNegotiationResponse(path)).toBeUndefined();
    }
  });

  test("returns markdown 404 responses for missing supported content", () => {
    const missingDocs = getMarkdownNegotiationResponse("/docs/missing");
    const missingItem = getMarkdownNegotiationResponse("/components/missing");

    expect(missingDocs?.status).toBe(404);
    expect(missingDocs?.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
    expect(missingItem?.status).toBe(404);
    expect(missingItem?.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
    expect(getMarkdownNegotiationResponse("/missing")).toBeUndefined();
  });
});

function createRequest(accept?: string, method = "GET"): Request {
  return new Request("https://example.com/docs", {
    headers: accept ? { Accept: accept } : undefined,
    method,
  });
}
