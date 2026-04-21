export const siteConfig = {
  name: "_cn",
  registryName: "_cn",
  namespace: "@_cn",
  description: "A TanStack Start template for publishing a shadcn-compatible registry.",
  homepage: "https://underscore-cn.vercel.app",
  repositoryUrl: "https://github.com/jakejarvis/_cn",
  registry: {
    canonicalBasePath: "",
    indexPath: "/registry.json",
    itemPathPattern: "/{name}.json",
    aliasBasePaths: ["/r"],
  },
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
  return joinRegistryPath(siteConfig.registry.canonicalBasePath, siteConfig.registry.indexPath);
}

export function getCanonicalRegistryItemPath(itemName: string): string {
  const itemPath = siteConfig.registry.itemPathPattern.replaceAll(
    "{name}",
    encodeURIComponent(itemName),
  );

  return joinRegistryPath(siteConfig.registry.canonicalBasePath, itemPath);
}

export function getAliasRegistryIndexPaths(): string[] {
  return siteConfig.registry.aliasBasePaths.map((basePath) =>
    joinRegistryPath(basePath, siteConfig.registry.indexPath),
  );
}

export function getAliasRegistryItemPaths(itemName: string): string[] {
  const itemPath = siteConfig.registry.itemPathPattern.replaceAll(
    "{name}",
    encodeURIComponent(itemName),
  );

  return siteConfig.registry.aliasBasePaths.map((basePath) => joinRegistryPath(basePath, itemPath));
}

function getSiteOrigin(): string {
  return siteConfig.homepage.replace(/\/+$/u, "");
}

function normalizeSitePath(path: string): string {
  const trimmedPath = path.replace(/^\/+|\/+$/gu, "");

  return trimmedPath ? `/${trimmedPath}` : "/";
}

function joinRegistryPath(basePath: string, path: string): string {
  const trimmedBasePath = basePath.replace(/^\/+|\/+$/gu, "");
  const trimmedPath = path.replace(/^\/+|\/+$/gu, "");

  if (!trimmedBasePath) {
    return `/${trimmedPath}`;
  }

  if (!trimmedPath) {
    return `/${trimmedBasePath}`;
  }

  return `/${trimmedBasePath}/${trimmedPath}`;
}
