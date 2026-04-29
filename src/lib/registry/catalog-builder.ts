import { parseRegistryMdx } from "./mdx";
import type {
  RegistryFileDefinition,
  RegistryItemAuthoringDefinition,
  RegistryItemDefinition,
  RegistrySourceFileDefinition,
} from "./metadata";
import { getFileName, getParentPath, normalizePath } from "./paths";

type RegistryDisplayItem = Omit<RegistryItemDefinition, "description" | "files" | "title"> & {
  title: string;
  description: string;
  files: RegistryFileDefinition[];
};
export type RegistryFile = RegistryFileDefinition;
type RegistryItemModuleEntry = {
  path: string;
  registryItem: RegistryItemAuthoringDefinition;
  hasPreview: boolean;
  previewSource: string;
  hasUsage: boolean;
  usageSource: string;
};

const registryItemCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

export type RegistrySourceFile = RegistryFile & {
  fileName: string;
  sourcePath: string;
};

export type RegistryPreviewSourceFile = {
  path: string;
  fileName: string;
  source: string;
};

export type RegistryCatalogItem = RegistryDisplayItem & {
  sourceFiles: RegistrySourceFile[];
  previewSourceFile: RegistryPreviewSourceFile;
  hasPreview: boolean;
  hasUsage: boolean;
  usageSource: string;
};

export function createRegistryMetadataItems(
  sourcesByPath: Readonly<Record<string, string>>,
): RegistryItemDefinition[] {
  return createRegistryItemModuleEntries(sourcesByPath).map(({ path, registryItem }) =>
    toRegistryItemDefinition(
      registryItem,
      getRegistrySourceFileDefinitions(getParentPath(path), registryItem),
    ),
  );
}

export function createRegistryCatalogItems(
  sourcesByPath: Readonly<Record<string, string>>,
): RegistryCatalogItem[] {
  return createRegistryItemModuleEntries(sourcesByPath).map(toRegistryCatalogItem);
}

function createRegistryItemModuleEntries(
  sourcesByPath: Readonly<Record<string, string>>,
): RegistryItemModuleEntry[] {
  return Object.entries(sourcesByPath)
    .map(([path, source]) => Object.assign({ path }, parseRegistryMdx(path, source)))
    .toSorted((a, b) => compareRegistryItemNames(a.registryItem, b.registryItem));
}

function toRegistryCatalogItem(entry: RegistryItemModuleEntry): RegistryCatalogItem {
  const itemRoot = getParentPath(entry.path);
  const sourceFileDefinitions = getRegistrySourceFileDefinitions(itemRoot, entry.registryItem);
  const sourceFileDefinitionsByPath = new Map(
    sourceFileDefinitions.map((file) => [file.path, file]),
  );
  const catalogItem = toRegistryDisplayItemDefinition(entry.registryItem, sourceFileDefinitions);

  return {
    ...catalogItem,
    sourceFiles: catalogItem.files.map((file) =>
      toRegistrySourceFile(itemRoot, file, sourceFileDefinitionsByPath.get(file.path) ?? file),
    ),
    previewSourceFile: getPreviewSourceFile(entry.path, entry.previewSource),
    hasPreview: entry.hasPreview,
    hasUsage: entry.hasUsage,
    usageSource: entry.usageSource,
  };
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

    return item.files;
  }

  if (item.files?.length) {
    return item.files;
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
  return {
    path: `${itemRoot}/${item.name}.tsx`,
    type: item.type,
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

function compareRegistryItemNames(
  a: Pick<RegistryItemDefinition, "name" | "title">,
  b: Pick<RegistryItemDefinition, "name" | "title">,
): number {
  return (
    registryItemCollator.compare(
      a.title ?? getDefaultRegistryTitle(a.name),
      b.title ?? getDefaultRegistryTitle(b.name),
    ) || registryItemCollator.compare(a.name, b.name)
  );
}

function getDefaultRegistryTitle(name: string): string {
  return name
    .split("-")
    .map((segment) => `${segment.slice(0, 1).toUpperCase()}${segment.slice(1)}`)
    .join(" ");
}

function getPreviewSourceFile(path: string, source: string): RegistryPreviewSourceFile {
  return {
    path,
    fileName: getFileName(path),
    source,
  };
}

function toRegistrySourceFile(
  itemRoot: string,
  file: RegistryFile,
  sourceFile: RegistrySourceFileDefinition,
): RegistrySourceFile {
  return {
    ...file,
    fileName: getFileName(file.path),
    sourcePath: getRegistrySourcePath(itemRoot, sourceFile),
  };
}

function getRegistrySourcePath(itemRoot: string, file: RegistrySourceFileDefinition): string {
  const sourcePath = file.sourcePath ?? file.path;

  if (sourcePath.startsWith("registry/")) {
    return normalizePath(sourcePath.split("/"));
  }

  return normalizePath([...itemRoot.split("/"), ...sourcePath.split("/")]);
}
