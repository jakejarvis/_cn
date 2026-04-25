import { escapeMarkdownLinkText, joinMarkdownBlocks } from "../content/markdown";
import {
  createLinkedMarkdownResponse,
  createMarkdownNotFoundResponse,
} from "../content/responses.server";
import { getCanonicalDocsUrl } from "../site-config";
import { docsPages, getDocsPage } from "./catalog";

export function getAuthoredDocsPageMarkdownResponse(path: string): Response {
  const page = getDocsPage(path);
  const markdown = getAuthoredDocsPageMarkdown(path);

  if (!page || !markdown) {
    return createMarkdownNotFoundResponse();
  }

  return createLinkedMarkdownResponse(markdown, page.routePath);
}

export function createAuthoredDocsIndexMarkdown(
  pages: readonly Pick<
    NonNullable<(typeof docsPages)[number]>,
    "description" | "routePath" | "title"
  >[],
): string {
  const pageList = pages
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

  return createAuthoredDocsPageMarkdown(page);
}

export function createAuthoredDocsPageMarkdown(
  page: Pick<NonNullable<(typeof docsPages)[number]>, "contentSource" | "description" | "title">,
): string {
  const content = page.contentSource.trim();

  if (content.startsWith("# ")) {
    return `${content}\n`;
  }

  return joinMarkdownBlocks([`# ${page.title}`, page.description, content]);
}
