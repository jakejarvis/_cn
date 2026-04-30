import Negotiator from "negotiator";
import { match } from "path-to-regexp";

import { getAuthoredDocsPageMarkdownResponse } from "./docs/markdown.server";
import {
  getRegistryCatalogMarkdownResponse,
  getRegistryItemMarkdownResponse,
  getRegistrySectionItemMarkdownResponse,
  getRegistrySectionMarkdownResponse,
} from "./registry/markdown.server";
import { getRegistrySection } from "./registry/sections";

const markdownMediaTypes = new Set(["text/plain", "text/markdown", "text/x-markdown"]);
const fileExtensionPattern = /\/[^/]+\.[^/]+$/u;

// Keep route matching compiled at module load; this middleware runs on every request.
const pathMatcherOptions = { decode: decodePathSegment, sensitive: true } as const;
const docsPathMatcher = match<{ slug?: string }>("/docs{/:slug}", pathMatcherOptions);
const registryPathMatcher = match<{ name?: string }>("/registry{/:name}", pathMatcherOptions);
const registrySectionPathMatcher = match<{ section: string; name?: string }>(
  "/:section{/:name}",
  pathMatcherOptions,
);

export function getMarkdownNegotiationResponseForRequest(
  request: Request,
  pathname: string,
): Response | undefined {
  if (request.method !== "GET" || !isMarkdownPreferred(request)) {
    return undefined;
  }

  return getMarkdownNegotiationResponse(pathname);
}

export function isMarkdownPreferred(request: Request): boolean {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return new Negotiator({ headers })
    .mediaTypes()
    .some((mediaType) => markdownMediaTypes.has(mediaType.toLowerCase()));
}

export function getMarkdownNegotiationResponse(pathname: string): Response | undefined {
  const path = normalizePathname(pathname);

  // Only human-facing HTML routes participate; machine endpoints and assets keep their own responses.
  if (path === "/" || path.startsWith("/r/") || fileExtensionPattern.test(path)) {
    return undefined;
  }

  const docsMatch = docsPathMatcher(path);
  if (docsMatch) return getAuthoredDocsPageMarkdownResponse(docsMatch.params.slug ?? "");

  const registryMatch = registryPathMatcher(path);
  if (registryMatch) {
    const itemName = registryMatch.params.name;

    return itemName
      ? getRegistryItemMarkdownResponse(itemName)
      : getRegistryCatalogMarkdownResponse();
  }

  const registrySectionMatch = registrySectionPathMatcher(path);
  if (registrySectionMatch) {
    const { section, name } = registrySectionMatch.params;

    if (!getRegistrySection(section)) {
      return undefined;
    }

    return name
      ? getRegistrySectionItemMarkdownResponse(section, name)
      : getRegistrySectionMarkdownResponse(section);
  }

  return undefined;
}

function normalizePathname(pathname: string): string {
  // TanStack Start passes a pathname here, so avoid URL parsing and only normalize trailing slashes.
  return pathname.replace(/\/+$/u, "") || "/";
}

function decodePathSegment(segment: string): string {
  // Malformed percent-encoding should miss content normally instead of failing the request.
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
