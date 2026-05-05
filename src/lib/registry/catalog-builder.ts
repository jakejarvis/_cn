import { compareRegistryItemNames, getDefaultRegistryTitle } from "./item-title";
import { parseRegistryMdx } from "./mdx";
import type {
  RegistryFileAuthoringDefinition,
  RegistryFileDefinition,
  RegistryItemAuthoringDefinition,
  RegistryItemDefinition,
  RegistrySourceFileDefinition,
} from "./metadata";
import {
  getDefaultRegistryFilePublicPath,
  getFileName,
  getParentPath,
  getRegistryFileTarget,
  getRegistryFilePublicPath,
  isInvalidRegistryRelativePath,
  normalizeRegistryRelativePath,
} from "./paths";

export { compareRegistryItemNames, getDefaultRegistryTitle } from "./item-title";

type RegistryDisplayItem = Omit<RegistryItemDefinition, "description" | "files" | "title"> & {
  title: string;
  description: string;
  files: RegistryFileDefinition[];
};

export type RegistryItemModuleEntry = {
  path: string;
  registryItem: RegistryItemAuthoringDefinition;
  hasUsage: boolean;
  usageSource: string;
};

export type RegistryPreviewModuleEntry = {
  path: string;
  source: string;
};

export type RegistrySourceFile = RegistryFileDefinition & {
  fileName: string;
  sourcePath: string;
};

export type RegistryPreviewSourceFile = {
  path: string;
  fileName: string;
  source: string;
};

export type RegistryCatalogItem = RegistryDisplayItem & {
  registryMdxFilePath: string;
  sourceFiles: RegistrySourceFile[];
  previewSourceFile: RegistryPreviewSourceFile;
  hasPreview: boolean;
  hasUsage: boolean;
  usageSource: string;
};

export function createRegistryMetadataItems(
  sourcesByPath: Readonly<Record<string, string>>,
): RegistryItemDefinition[] {
  return createRegistryMetadataItemsFromEntries(createRegistryItemModuleEntries(sourcesByPath));
}

export function createRegistryMetadataItemsFromEntries(
  entries: readonly RegistryItemModuleEntry[],
): RegistryItemDefinition[] {
  return getSortedRegistryItemModuleEntries(entries).map(({ path, registryItem }) =>
    toRegistryItemDefinition(
      registryItem,
      getRegistrySourceFileDefinitions(getParentPath(path), registryItem),
    ),
  );
}

export function createRegistryCatalogItems(
  sourcesByPath: Readonly<Record<string, string>>,
  previewSourcesByPath: Readonly<Record<string, string>> = {},
): RegistryCatalogItem[] {
  return createRegistryCatalogItemsFromEntries(
    createRegistryItemModuleEntries(sourcesByPath),
    createRegistryPreviewModuleEntries(previewSourcesByPath),
  );
}

export function createRegistryCatalogItemsFromEntries(
  entries: readonly RegistryItemModuleEntry[],
  previewEntries: readonly RegistryPreviewModuleEntry[] = [],
): RegistryCatalogItem[] {
  return getSortedRegistryItemModuleEntries(entries).map((entry) =>
    toRegistryCatalogItem(entry, previewEntries),
  );
}

function createRegistryItemModuleEntries(
  sourcesByPath: Readonly<Record<string, string>>,
): RegistryItemModuleEntry[] {
  return Object.entries(sourcesByPath)
    .map(([path, source]) => Object.assign({ path }, parseRegistryMdx(path, source)))
    .toSorted((a, b) => compareRegistryItemNames(a.registryItem, b.registryItem));
}

function createRegistryPreviewModuleEntries(
  previewSourcesByPath: Readonly<Record<string, string>>,
): RegistryPreviewModuleEntry[] {
  return Object.entries(previewSourcesByPath).map(([path, source]) => ({ path, source }));
}

function getSortedRegistryItemModuleEntries(
  entries: readonly RegistryItemModuleEntry[],
): RegistryItemModuleEntry[] {
  return [...entries].toSorted((a, b) => compareRegistryItemNames(a.registryItem, b.registryItem));
}

function toRegistryCatalogItem(
  entry: RegistryItemModuleEntry,
  previewEntries: readonly RegistryPreviewModuleEntry[],
): RegistryCatalogItem {
  const itemRoot = getParentPath(entry.path);
  const previewEntry = previewEntries.find((preview) => preview.path === getPreviewPath(itemRoot));
  const previewSource =
    previewEntry && hasRegistryPreviewExport(previewEntry.source) ? previewEntry.source : "";
  const sourceFileDefinitions = getRegistrySourceFileDefinitions(itemRoot, entry.registryItem);
  const sourceFileDefinitionsByPath = new Map(
    sourceFileDefinitions.map((file) => [file.path, file]),
  );
  const catalogItem = toRegistryDisplayItemDefinition(entry.registryItem, sourceFileDefinitions);

  return {
    ...catalogItem,
    registryMdxFilePath: entry.path,
    sourceFiles: catalogItem.files.map((file) => {
      const sourceFile = sourceFileDefinitionsByPath.get(file.path);

      if (!sourceFile) {
        throw new Error(`Registry item "${catalogItem.name}" could not resolve ${file.path}.`);
      }

      return toRegistrySourceFile(file, sourceFile);
    }),
    previewSourceFile: getPreviewSourceFile(itemRoot, previewSource),
    hasPreview: previewSource.length > 0,
    hasUsage: entry.hasUsage,
    usageSource: entry.usageSource,
  };
}

export function hasRegistryPreviewExport(source: string): boolean {
  const code = stripCommentsAndText(source);
  const namedDeclarationPattern =
    /(?:^|[;\n])\s*export\s+(?:(?:async\s+)?function|(?:const|let|var)|(?:abstract\s+)?class)\s+Preview\b/u;

  return namedDeclarationPattern.test(code) || hasNamedPreviewExportSpecifier(code);
}

function hasNamedPreviewExportSpecifier(source: string): boolean {
  for (const match of source.matchAll(/(?:^|[;\n])\s*export\s+(?!type\b)\{([^}]*)\}/gu)) {
    if (match[1]?.split(",").some(isPreviewExportSpecifier)) {
      return true;
    }
  }

  return false;
}

function isPreviewExportSpecifier(specifier: string): boolean {
  const normalized = specifier.trim().replace(/\s+/gu, " ");

  if (!normalized || normalized.startsWith("type ")) {
    return false;
  }

  return (normalized.match(/\s+as\s+([A-Za-z_$][\w$]*)$/u)?.[1] ?? normalized) === "Preview";
}

function stripCommentsAndText(source: string): string {
  let output = "";
  let index = 0;

  while (index < source.length) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (char === "/" && nextChar === "/") {
      const nextLineIndex = source.indexOf("\n", index + 2);

      if (nextLineIndex === -1) {
        break;
      }

      output += "\n";
      index = nextLineIndex + 1;
      continue;
    }

    if (char === "/" && nextChar === "*") {
      const endIndex = source.indexOf("*/", index + 2);
      const comment = source.slice(index, endIndex === -1 ? source.length : endIndex + 2);

      output += comment.replace(/[^\n]/gu, " ");
      index += comment.length;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      const endIndex = getTextLiteralEndIndex(source, index, char);
      const literal = source.slice(index, endIndex);

      output += literal.replace(/[^\n]/gu, " ");
      index = endIndex;
      continue;
    }

    output += char;
    index += 1;
  }

  return output;
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

function getRegistrySourceFileDefinitions(
  itemRoot: string,
  item: RegistryItemAuthoringDefinition,
): RegistrySourceFileDefinition[] {
  if (item.type === "registry:page" || item.type === "registry:file") {
    if (!item.files?.length) {
      throw new Error(
        `Registry item "${item.name}" (${item.type}) must declare a non-empty "files" array in frontmatter.`,
      );
    }

    return item.files.map((file) => normalizeRegistrySourceFileDefinition(itemRoot, file));
  }

  if (item.files?.length) {
    return item.files.map((file) => normalizeRegistrySourceFileDefinition(itemRoot, file));
  }

  if (item.type === "registry:ui") {
    return [getDefaultRegistryFile(itemRoot, { name: item.name, type: item.type })];
  }

  return [];
}

function getDefaultRegistryFile(
  itemRoot: string,
  item: Pick<RegistryItemAuthoringDefinition, "name"> & { type: "registry:ui" },
): RegistrySourceFileDefinition {
  const path = getDefaultRegistryFilePublicPath(`${item.name}.tsx`, item.type);

  return {
    path,
    sourcePath: `${itemRoot}/${item.name}.tsx`,
    target: getRegistryFileTarget({ path, type: item.type }),
    type: item.type,
  };
}

function normalizeRegistrySourceFileDefinition(
  itemRoot: string,
  file: RegistryFileAuthoringDefinition,
): RegistrySourceFileDefinition {
  const path = getRegistryFilePublicPath(file);
  const target = getRegistryFileTarget({ ...file, path });

  return {
    ...file,
    path,
    sourcePath: getRegistrySourcePath(itemRoot, file),
    ...(target ? { target } : {}),
  };
}

function toRegistryItemDefinition(
  item: RegistryItemAuthoringDefinition,
  files: RegistrySourceFileDefinition[],
): RegistryItemDefinition {
  const displayItem = toRegistryDisplayItemDefinition(item, files);
  const { files: registryFiles, ...itemWithoutFiles } = displayItem;

  return registryFiles.length > 0
    ? {
        ...itemWithoutFiles,
        files: registryFiles,
      }
    : itemWithoutFiles;
}

function toRegistryDisplayItemDefinition(
  item: RegistryItemAuthoringDefinition,
  files: RegistrySourceFileDefinition[],
): RegistryDisplayItem {
  return {
    ...item,
    title: item.title ?? getDefaultRegistryTitle(item.name),
    description: item.description ?? "",
    files: files.map(toRegistryFileDefinition),
  };
}

function toRegistryFileDefinition(file: RegistrySourceFileDefinition): RegistryFileDefinition {
  const { sourcePath: _sourcePath, ...registryFile } = file;

  return registryFile;
}

function getPreviewSourceFile(itemRoot: string, source: string): RegistryPreviewSourceFile {
  const path = getPreviewPath(itemRoot);

  return {
    path,
    fileName: getFileName(path),
    source,
  };
}

function getPreviewPath(itemRoot: string): string {
  return `${itemRoot}/_preview.tsx`;
}

function toRegistrySourceFile(
  file: RegistryFileDefinition,
  sourceFile: RegistrySourceFileDefinition,
): RegistrySourceFile {
  return {
    ...file,
    fileName: getFileName(file.path),
    sourcePath: sourceFile.sourcePath,
  };
}

function getRegistrySourcePath(
  itemRoot: string,
  file: Pick<RegistryFileAuthoringDefinition, "path">,
): string {
  const normalizedSourcePath = normalizeRegistryRelativePath(file.path);

  if (isInvalidRegistryRelativePath(normalizedSourcePath)) {
    return normalizedSourcePath;
  }

  return normalizeRegistryRelativePath(`${itemRoot}/${normalizedSourcePath}`);
}
