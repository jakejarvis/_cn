import { getAuthoredDocsPageMarkdownResponse } from "@/lib/docs/markdown.server";
import {
  getRegistryItemMarkdownResponse,
  getRegistrySectionMarkdownResponse,
} from "@/lib/registry/markdown.server";
import { registrySectionList, type RegistrySection } from "@/lib/registry/sections";

const markdownMediaTypes = new Set(["text/plain", "text/markdown", "text/x-markdown"]);
const fileExtensionPattern = /\/[^/]+\.[^/]+$/u;

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
  const acceptHeader = request.headers.get("Accept");

  if (!acceptHeader) {
    return false;
  }

  return getAcceptedMediaTypes(acceptHeader).some((mediaType) => markdownMediaTypes.has(mediaType));
}

export function getMarkdownNegotiationResponse(pathname: string): Response | undefined {
  const path = getNegotiablePathname(pathname);

  if (!path) {
    return undefined;
  }

  const docsPath = getDocsPath(path);

  if (docsPath !== undefined) {
    return getAuthoredDocsPageMarkdownResponse(docsPath);
  }

  const registryPath = getRegistryPath(path);

  if (!registryPath) {
    return undefined;
  }

  if (!registryPath.itemName) {
    return getRegistrySectionMarkdownResponse(registryPath.section);
  }

  return getRegistryItemMarkdownResponse(registryPath.section, registryPath.itemName);
}

function getAcceptedMediaTypes(acceptHeader: string): string[] {
  return acceptHeader.split(",").flatMap((entry) => {
    const [mediaType, ...parameters] = entry.split(";").map((part) => part.trim().toLowerCase());

    if (!mediaType || isExplicitlyRejected(parameters)) {
      return [];
    }

    return [mediaType];
  });
}

function isExplicitlyRejected(parameters: readonly string[]): boolean {
  return parameters.some((parameter) => {
    const [key, value] = parameter.split("=", 2).map((part) => part.trim());

    return key === "q" && Number(value) === 0;
  });
}

function getNegotiablePathname(pathname: string): string | undefined {
  const normalizedPath = normalizePathname(pathname);

  if (
    normalizedPath === "/" ||
    normalizedPath.startsWith("/r/") ||
    fileExtensionPattern.test(normalizedPath)
  ) {
    return undefined;
  }

  return normalizedPath;
}

function getDocsPath(pathname: string): string | undefined {
  if (pathname === "/docs") {
    return "";
  }

  if (pathname.startsWith("/docs/")) {
    return decodePathSegment(pathname.slice("/docs/".length));
  }

  return undefined;
}

function getRegistryPath(
  pathname: string,
): { section: RegistrySection; itemName?: string } | undefined {
  for (const section of registrySectionList) {
    if (pathname === section.basePath) {
      return { section: section.id };
    }

    const itemPrefix = `${section.basePath}/`;

    if (pathname.startsWith(itemPrefix)) {
      return {
        section: section.id,
        itemName: decodePathSegment(pathname.slice(itemPrefix.length)),
      };
    }
  }

  return undefined;
}

function normalizePathname(pathname: string): string {
  const urlPathname = getUrlPathname(pathname);
  const trimmedPathname = urlPathname.replace(/\/+$/u, "");

  return trimmedPathname || "/";
}

function getUrlPathname(pathname: string): string {
  try {
    return new URL(pathname, "https://example.invalid").pathname;
  } catch {
    return pathname.split(/[?#]/u)[0] || "/";
  }
}

function decodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
