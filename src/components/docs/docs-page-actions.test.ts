import { describe, expect, test, vi } from "vitest";

import { getDocsPageActionLinks, getDocsPageMarkdown } from "./docs-page-actions";

type FetchMock = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

describe("docs page actions", () => {
  test("fetches page markdown through an explicit fetch mock", async () => {
    const fetchMock = vi.fn<FetchMock>(() =>
      Promise.resolve(
        new Response("# Getting Started\n", {
          status: 200,
        }),
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(getDocsPageMarkdown("/docs/getting-started.md")).resolves.toBe(
      "# Getting Started\n",
    );
    expect(fetchMock).toHaveBeenCalledWith("/docs/getting-started.md", {
      headers: {
        Accept: "text/markdown",
      },
    });
  });

  test("rejects unavailable page markdown", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<FetchMock>(() => Promise.resolve(new Response("Missing", { status: 404 }))),
    );

    await expect(getDocsPageMarkdown("/docs/missing.md")).rejects.toThrow(
      "Page markdown is unavailable.",
    );
  });

  test("builds external action links from URL APIs", () => {
    const pageUrl = "https://example.com/docs/getting-started";
    const links = getDocsPageActionLinks({
      markdownPath: "/docs/getting-started.md",
      pageDescription: "Install and run the registry.",
      pageTitle: "Getting Started",
      pageUrl,
    });

    expect(links.find((link) => link.label === "View as Markdown")).toEqual({
      label: "View as Markdown",
      href: "/docs/getting-started.md",
    });
    expect(links.find((link) => link.label === "Open in v0")).toBeUndefined();

    const chatGptUrl = new URL(assertLink(links, "Open in ChatGPT").href);

    expect(chatGptUrl.origin).toBe("https://chatgpt.com");
    expect(chatGptUrl.searchParams.get("q")).toContain(pageUrl);
  });

  test("builds open in v0 links from registry item JSON URLs", () => {
    const registryItemJsonUrl = "https://example.com/r/alpha-card.json";
    const links = getDocsPageActionLinks({
      markdownPath: "/components/alpha-card.md",
      pageDescription: "A compact card component.",
      pageTitle: "Alpha Card",
      pageUrl: "https://example.com/components/alpha-card",
      registryItemJsonUrl,
    });
    const v0Url = new URL(assertLink(links, "Open in v0").href);

    expect(v0Url.origin).toBe("https://v0.app");
    expect(v0Url.pathname).toBe("/chat/api/open");
    expect(v0Url.searchParams.get("url")).toBe(registryItemJsonUrl);
    expect(v0Url.searchParams.get("title")).toBe("Alpha Card");
    expect(v0Url.searchParams.get("prompt")).toBe("A compact card component.");
  });
});

function assertLink(links: { label: string; href: string }[], label: string): { href: string } {
  const link = links.find((candidate) => candidate.label === label);

  if (!link) {
    throw new Error(`Missing action link: ${label}`);
  }

  return link;
}
