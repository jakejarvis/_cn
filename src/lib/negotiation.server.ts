import Negotiator from "negotiator";
import { match } from "path-to-regexp";

import { getAuthoredDocsPageMarkdownResponse } from "./docs/markdown.server";
import { getRegistryIndexJsonResponse, getRegistryItemJsonResponse } from "./registry/json.server";
import {
  getRegistryCatalogMarkdownResponse,
  getRegistryItemMarkdownResponse,
  getRegistrySectionItemMarkdownResponse,
  getRegistrySectionMarkdownResponse,
} from "./registry/markdown.server";
import { getRegistrySection } from "./registry/sections";

const markdownMediaTypes = new Set(["text/plain", "text/markdown", "text/x-markdown"]);
const shadcnRegistryMediaType = "application/vnd.shadcn.v1+json";
const contentNegotiationVaryHeaders = ["Accept", "User-Agent"] as const;
const fileExtensionPattern = /\/[^/]+\.[^/]+$/u;

// Keep route matching compiled at module load; this middleware runs on every request.
const pathMatcherOptions = { decode: decodePathSegment, sensitive: true } as const;
const docsPathMatcher = match<{ slug?: string }>("/docs{/:slug}", pathMatcherOptions);
const registryPathMatcher = match<{ name?: string }>("/registry{/:name}", pathMatcherOptions);
const registrySectionPathMatcher = match<{ section: string; name?: string }>(
  "/:section{/:name}",
  pathMatcherOptions,
);

type RegistryJsonNegotiationTarget =
  | {
      type: "index";
    }
  | {
      type: "item";
      name: string;
    };

export function getContentNegotiationResponseForRequest(
  request: Request,
  pathname: string,
): Response | undefined {
  if (request.method !== "GET") {
    return undefined;
  }

  return (
    getRegistryJsonNegotiationResponseForRequest(request, pathname) ??
    getMarkdownNegotiationResponseForRequest(request, pathname)
  );
}

export function appendContentNegotiationVaryHeader(response: Response): Response {
  const headers = new Headers(response.headers);

  headers.set("Vary", mergeVaryHeader(headers.get("Vary"), contentNegotiationVaryHeaders));

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

export function getRegistryJsonNegotiationResponseForRequest(
  request: Request,
  pathname: string,
): Response | undefined {
  if (request.method !== "GET" || !isShadcnRegistryJsonPreferred(request)) {
    return undefined;
  }

  const response = getRegistryJsonNegotiationResponse(pathname);

  return response ? appendContentNegotiationVaryHeader(response) : undefined;
}

export function isShadcnRegistryJsonPreferred(request: Request): boolean {
  if (isShadcnCliUserAgent(request)) {
    return true;
  }

  return getAcceptedMediaTypes(request).some(
    (mediaType) => mediaType.toLowerCase() === shadcnRegistryMediaType,
  );
}

export function getRegistryJsonNegotiationResponse(pathname: string): Response | undefined {
  const target = getRegistryJsonNegotiationTarget(normalizePathname(pathname));

  if (!target) {
    return undefined;
  }

  return target.type === "index"
    ? getRegistryIndexJsonResponse()
    : getRegistryItemJsonResponse(target.name);
}

export function getMarkdownNegotiationResponseForRequest(
  request: Request,
  pathname: string,
): Response | undefined {
  if (request.method !== "GET" || !isMarkdownPreferred(request)) {
    return undefined;
  }

  const response = getMarkdownNegotiationResponse(pathname);

  return response ? appendContentNegotiationVaryHeader(response) : undefined;
}

export function isMarkdownPreferred(request: Request): boolean {
  return getAcceptedMediaTypes(request).some((mediaType) =>
    markdownMediaTypes.has(mediaType.toLowerCase()),
  );
}

export function getMarkdownNegotiationResponse(pathname: string): Response | undefined {
  const path = normalizePathname(pathname);

  if (path === "/" || isMachineEndpointOrAssetPath(path)) {
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

function getRegistryJsonNegotiationTarget(path: string): RegistryJsonNegotiationTarget | undefined {
  if (isMachineEndpointOrAssetPath(path)) {
    return undefined;
  }

  if (path === "/") {
    return { type: "item", name: "index" };
  }

  const registryMatch = registryPathMatcher(path);
  if (registryMatch) {
    const itemName = registryMatch.params.name;

    return itemName ? { type: "item", name: itemName } : { type: "index" };
  }

  const registrySectionMatch = registrySectionPathMatcher(path);
  if (registrySectionMatch) {
    const { section, name } = registrySectionMatch.params;

    if (name && getRegistrySection(section)) {
      return { type: "item", name };
    }
  }

  return undefined;
}

function isMachineEndpointOrAssetPath(path: string): boolean {
  return path.startsWith("/r/") || fileExtensionPattern.test(path);
}

function getAcceptedMediaTypes(request: Request): string[] {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return new Negotiator({ headers }).mediaTypes();
}

function isShadcnCliUserAgent(request: Request): boolean {
  return request.headers.get("User-Agent")?.trim().toLowerCase().startsWith("shadcn") ?? false;
}

function mergeVaryHeader(currentValue: string | null, headersToAdd: readonly string[]): string {
  if (!currentValue) {
    return headersToAdd.join(", ");
  }

  const currentHeaders = currentValue
    .split(",")
    .map((header) => header.trim())
    .filter(Boolean);
  if (currentHeaders.includes("*")) {
    return "*";
  }

  const normalizedCurrentHeaders = new Set(currentHeaders.map((header) => header.toLowerCase()));
  const missingHeaders = headersToAdd.filter(
    (header) => !normalizedCurrentHeaders.has(header.toLowerCase()),
  );

  return [...currentHeaders, ...missingHeaders].join(", ");
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
