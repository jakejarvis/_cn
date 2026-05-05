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

type RegistryDisplaySourceOptions = {
  registryItems?: readonly RegistryDisplaySourceItem[];
};

const targetAliasPrefixes = [
  ["@ui/", componentsConfig.aliases.ui],
  ["@components/", componentsConfig.aliases.components],
  ["@hooks/", componentsConfig.aliases.hooks],
  ["@lib/", componentsConfig.aliases.lib],
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
  options: RegistryDisplaySourceOptions = {},
): string {
  const displayImportPaths = getRegistryDisplayImportPaths(item, options);
  const importerPath = file.sourcePath ?? file.path;
  const isPreviewSourceFile = isRegistryPreviewSourceFile(file);
  const source = isPreviewSourceFile ? cleanRegistryPreviewDisplaySource(file.source) : file.source;

  const displaySource = source.replace(
    importSpecifierPattern,
    (match: string, prefix: string, specifier: string, suffix: string) => {
      const sourcePath = resolveRegistrySourceImportPath(
        importerPath,
        specifier,
        displayImportPaths,
      );

      if (!sourcePath) {
        const aliasImportPath = resolveRegistryAliasImportPath(importerPath, specifier);

        return aliasImportPath ? `${prefix}${aliasImportPath}${suffix}` : match;
      }

      const displayImportPath = displayImportPaths.get(sourcePath);

      return displayImportPath ? `${prefix}${displayImportPath}${suffix}` : match;
    },
  );

  return isPreviewSourceFile ? displaySource.trim() : displaySource;
}

function isRegistryPreviewSourceFile(file: RegistryDisplaySourceFile): boolean {
  return getFileName(file.path) === "_preview.tsx";
}

function cleanRegistryPreviewDisplaySource(source: string): string {
  return stripUseClientDirective(stripToolingDirectiveComments(source));
}

function stripUseClientDirective(source: string): string {
  return source.replace(/^(?:\uFEFF)?\s*(?:"use client"|'use client');?[ \t]*(?:\r?\n)+/u, "");
}

function stripToolingDirectiveComments(source: string): string {
  let output = "";
  let index = 0;

  while (index < source.length) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (char === "/" && nextChar === "/") {
      const endIndex = getLineCommentEndIndex(source, index);
      const comment = source.slice(index, endIndex);

      if (!isToolingDirectiveComment(comment)) {
        output += comment;
      }

      index = endIndex;
      continue;
    }

    if (char === "/" && nextChar === "*") {
      const endIndex = getBlockCommentEndIndex(source, index);
      const comment = source.slice(index, endIndex);

      if (!isToolingDirectiveComment(comment)) {
        output += comment;
      }

      index = endIndex;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      const endIndex = getTextLiteralEndIndex(source, index, char);

      output += source.slice(index, endIndex);
      index = endIndex;
      continue;
    }

    output += char;
    index += 1;
  }

  return output;
}

function isToolingDirectiveComment(comment: string): boolean {
  return /\b(?:eslint(?:-[\w-]+)?|biome(?:-[\w-]+)?|oxlint(?:-[\w-]+)?|prettier(?:-[\w-]+)?|rome(?:-[\w-]+)?|deno-lint-ignore(?:-file)?|tslint:(?:disable|enable)|stylelint-(?:disable|enable)|(?:istanbul|c8|v8)\s+ignore)\b|@ts-(?:check|nocheck|ignore|expect-error)\b/iu.test(
    comment,
  );
}

function getLineCommentEndIndex(source: string, startIndex: number): number {
  const nextLineIndex = source.indexOf("\n", startIndex + 2);

  return nextLineIndex === -1 ? source.length : nextLineIndex;
}

function getBlockCommentEndIndex(source: string, startIndex: number): number {
  const endIndex = source.indexOf("*/", startIndex + 2);

  return endIndex === -1 ? source.length : endIndex + 2;
}

function getTextLiteralEndIndex(source: string, startIndex: number, delimiter: string): number {
  let index = startIndex + 1;

  while (index < source.length) {
    if (source[index] === "\\") {
      index += 2;
      continue;
    }

    if (source[index] === delimiter) {
      return index + 1;
    }

    index += 1;
  }

  return source.length;
}

function resolveRegistryAliasImportPath(importerPath: string, specifier: string): string | null {
  const normalizedPath = normalizePath([
    ...getParentPath(importerPath).split("/"),
    ...specifier.split(/[?#]/u)[0].split("/"),
  ]);
  const aliasImportPath = getAliasImportPathForTarget(normalizedPath);

  return aliasImportPath === normalizedPath ? null : aliasImportPath;
}

function getRegistryDisplayImportPaths(
  item: RegistryDisplaySourceItem,
  options: RegistryDisplaySourceOptions,
): Map<string, string> {
  const importPaths = new Map<string, string>();
  const knownRegistryItems = options.registryItems ?? registryItems;

  for (const file of [
    ...knownRegistryItems.flatMap((registryItem) => registryItem.sourceFiles),
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
    case "registry:ui":
      return componentsConfig.aliases.ui;
    case "registry:block":
    case "registry:component":
      return componentsConfig.aliases.components;
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
