import { getLinkedHeaders, getMarkdownHttpLinkHeader } from "@/lib/seo";

import { markdownResponseHeaders } from "./markdown";

export function createLinkedMarkdownResponse(markdown: string, pagePath: string): Response {
  return new Response(markdown, {
    headers: getLinkedMarkdownHeaders(pagePath),
  });
}

export function createMarkdownNotFoundResponse(message = "Docs page not found."): Response {
  return new Response(message, {
    headers: markdownResponseHeaders,
    status: 404,
  });
}

export function getLinkedMarkdownHeaders(pagePath: string): HeadersInit {
  return getLinkedHeaders(markdownResponseHeaders, getMarkdownHttpLinkHeader(pagePath));
}
