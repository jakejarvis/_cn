import { getCanonicalDocsUrl } from "@/lib/site-config";

import { docsPages, getDocsPage } from "./catalog";

export const authoredDocsMarkdownResponseHeaders = {
  "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
  "Content-Type": "text/markdown; charset=utf-8",
} as const;

export function getAuthoredDocsPageMarkdownResponse(path: string): Response {
  const markdown = getAuthoredDocsPageMarkdown(path);

  if (!markdown) {
    return new Response("Docs page not found.", {
      headers: authoredDocsMarkdownResponseHeaders,
      status: 404,
    });
  }

  return new Response(markdown, {
    headers: authoredDocsMarkdownResponseHeaders,
  });
}

export function getAuthoredDocsIndexMarkdown(): string {
  const pageList = docsPages
    .map(
      (page) =>
        `- [${escapeMarkdownLinkText(page.title)}](${getCanonicalDocsUrl(page.routePath)}): ${
          page.description || "Documentation page."
        }`,
    )
    .join("\n");

  return joinMarkdownBlocks(["# Docs", pageList || "No docs pages are published yet."]);
}

export function getAuthoredDocsPageMarkdown(path: string): string | null {
  const page = getDocsPage(path);

  if (!page) {
    return null;
  }

  const content = page.contentSource.trim();

  if (content.startsWith("# ")) {
    return `${content}\n`;
  }

  return joinMarkdownBlocks([`# ${page.title}`, page.description, content]);
}

function joinMarkdownBlocks(blocks: string[]): string {
  return `${blocks.filter((block) => block.trim().length > 0).join("\n\n")}\n`;
}

function escapeMarkdownLinkText(value: string): string {
  return value.replace(/[[\]\\]/gu, "\\$&");
}
