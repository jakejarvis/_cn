import componentsConfig from "../../../components.json";
import { registryItems } from "./catalog";
import type { RegistryFileType } from "./metadata";
import { getFileName, getParentPath, normalizePath, stripCodeExtension } from "./paths";

type RegistryDisplaySourceFile = {
  path: string;
  sourcePath?: string;
  source: string;
};

type RegistryDisplayPublishedFile = {
  path: string;
  sourcePath?: string;
  type: RegistryFileType;
  target?: string;
};

type RegistryDisplaySourceItem = {
  sourceFiles: readonly RegistryDisplayPublishedFile[];
};

const targetAliasPrefixes = [
  ["components/ui/", componentsConfig.aliases.ui],
  ["components/", componentsConfig.aliases.components],
  ["hooks/", componentsConfig.aliases.hooks],
  ["lib/", componentsConfig.aliases.lib],
] as const;

const importSpecifierPattern =
  /(\bfrom\s*["']|\bimport\s*["']|\bimport\s*\(\s*["'])(\.{1,2}\/[^"']+)(["'])/gu;

export function getRegistryDisplaySource(
  item: RegistryDisplaySourceItem,
  file: RegistryDisplaySourceFile,
): string {
  const displayImportPaths = getRegistryDisplayImportPaths(item);
  const importerPath = file.sourcePath ?? file.path;

  return file.source.replace(
    importSpecifierPattern,
    (match: string, prefix: string, specifier: string, suffix: string) => {
      const sourcePath = resolveRegistrySourceImportPath(
        importerPath,
        specifier,
        displayImportPaths,
      );

      if (!sourcePath) {
        return match;
      }

      const displayImportPath = displayImportPaths.get(sourcePath);

      return displayImportPath ? `${prefix}${displayImportPath}${suffix}` : match;
    },
  );
}

function getRegistryDisplayImportPaths(item: RegistryDisplaySourceItem): Map<string, string> {
  const importPaths = new Map<string, string>();

  for (const file of [
    ...registryItems.flatMap((registryItem) => registryItem.sourceFiles),
    ...item.sourceFiles,
  ]) {
    const importPath = getRegistryFileDisplayImportPath(file);

    if (!importPath) {
      continue;
    }

    importPaths.set(file.path, importPath);

    if (file.sourcePath) {
      importPaths.set(file.sourcePath, importPath);
    }
  }

  return importPaths;
}

function getRegistryFileDisplayImportPath(file: RegistryDisplayPublishedFile): string | null {
  if (file.target) {
    return stripCodeExtension(getAliasImportPathForTarget(file.target));
  }

  const alias = getAliasForRegistryFileType(file.type);

  return alias ? joinImportPath(alias, stripCodeExtension(getFileName(file.path))) : null;
}

function getAliasImportPathForTarget(target: string): string {
  const normalizedTarget = target.replace(/^\.?\//u, "").replace(/^src\//u, "");

  for (const [prefix, alias] of targetAliasPrefixes) {
    if (normalizedTarget.startsWith(prefix)) {
      return joinImportPath(alias, normalizedTarget.slice(prefix.length));
    }
  }

  return target;
}

function getAliasForRegistryFileType(type: RegistryFileType): string | null {
  switch (type) {
    case "registry:component":
    case "registry:ui":
      return componentsConfig.aliases.ui;
    case "registry:hook":
      return componentsConfig.aliases.hooks;
    case "registry:lib":
      return componentsConfig.aliases.lib;
    default:
      return null;
  }
}

function resolveRegistrySourceImportPath(
  importerPath: string,
  specifier: string,
  displayImportPaths: Map<string, string>,
): string | null {
  const normalizedPath = normalizePath([
    ...getParentPath(importerPath).split("/"),
    ...specifier.split(/[?#]/u)[0].split("/"),
  ]);
  const candidatePaths = [
    normalizedPath,
    `${normalizedPath}.ts`,
    `${normalizedPath}.tsx`,
    `${normalizedPath}/index.ts`,
    `${normalizedPath}/index.tsx`,
  ];

  return candidatePaths.find((candidatePath) => displayImportPaths.has(candidatePath)) ?? null;
}

function joinImportPath(basePath: string, childPath: string): string {
  return `${basePath.replace(/\/$/u, "")}/${childPath.replace(/^\/+/u, "")}`;
}
