import { registryConfig } from "../../registry/config.ts";

const registryPathConfig = {
  indexPath: "/registry.json",
  indexAliasPaths: ["/r/registry.json"],
  itemPathPattern: "/r/{name}.json",
  itemAliasPathPatterns: [],
} as const;

export const siteConfig = {
  ...registryConfig,
  registry: registryPathConfig,
} as const;

export function getCanonicalRegistryIndexUrl(): string {
  return `${getSiteOrigin()}${getCanonicalRegistryIndexPath()}`;
}

export function getCanonicalRegistryItemUrl(itemName: string): string {
  return `${getSiteOrigin()}${getCanonicalRegistryItemPath(itemName)}`;
}

export function getCanonicalDocsUrl(path: string): string {
  return getCanonicalSiteUrl(path);
}

export function getCanonicalSiteUrl(path: string): string {
  return `${getSiteOrigin()}${normalizeSitePath(path)}`;
}

export function getDocsMarkdownPath(path: string): string {
  return `${normalizeSitePath(path)}.md`;
}

export function getCanonicalRegistryIndexPath(): string {
  return normalizeSitePath(siteConfig.registry.indexPath);
}

export function getCanonicalRegistryItemPath(itemName: string): string {
  return formatRegistryItemPath(siteConfig.registry.itemPathPattern, itemName);
}

export function getAliasRegistryIndexPaths(): string[] {
  return siteConfig.registry.indexAliasPaths.map(normalizeSitePath);
}

export function getAliasRegistryItemPaths(itemName: string): string[] {
  return siteConfig.registry.itemAliasPathPatterns.map((pattern) =>
    formatRegistryItemPath(pattern, itemName),
  );
}

function getSiteOrigin(): string {
  return siteConfig.homepage.replace(/\/+$/u, "");
}

function normalizeSitePath(path: string): string {
  const trimmedPath = path.replace(/^\/+|\/+$/gu, "");

  return trimmedPath ? `/${trimmedPath}` : "/";
}

function formatRegistryItemPath(pattern: string, itemName: string): string {
  return normalizeSitePath(pattern.replaceAll("{name}", encodeURIComponent(itemName)));
}
