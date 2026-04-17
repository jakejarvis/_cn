import type {
  RegistryFileDefinition,
  RegistryItemAuthoringDefinition,
  RegistryItemDefinition,
  RegistrySourceFileDefinition,
} from "./metadata";
import { getFileName, getParentPath, normalizePath } from "./paths";

type RegistryItem = RegistryItemDefinition;
export type RegistryFile = RegistryFileDefinition;
type RegistryType = RegistryItem["type"];
type RegistryItemModule = {
  registryItem?: RegistryItemAuthoringDefinition;
};
type RegistryItemModuleEntry = {
  path: string;
  registryItem: RegistryItemAuthoringDefinition;
};

export const componentRegistryTypes = [
  "registry:ui",
  "registry:component",
] as const satisfies RegistryType[];

const registryItemModules = import.meta.glob<RegistryItemModule>(
  "../../../registry/items/**/_registry.tsx",
  {
    eager: true,
    query: "?registry-metadata",
  },
);

const registryItemModulesByPath = normalizeGlobFiles(registryItemModules);
const registryItemCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

const registryItemModuleEntries = Object.entries(registryItemModulesByPath)
  .flatMap(([path, module]) =>
    module.registryItem ? [{ path, registryItem: module.registryItem }] : [],
  )
  .toSorted((a, b) => compareRegistryItemNames(a.registryItem, b.registryItem));

export const registryMetadataItems = registryItemModuleEntries.map(({ path, registryItem }) =>
  toRegistryItemDefinition(
    registryItem,
    getRegistrySourceFileDefinitions(getParentPath(path), registryItem),
  ),
);

export type RegistrySourceFile = RegistryFile & {
  fileName: string;
  sourcePath: string;
};

export type RegistryPreviewSourceFile = {
  path: string;
  fileName: string;
};

export type RegistryCatalogItem = RegistryItem & {
  sourceFiles: RegistrySourceFile[];
  previewSourceFile: RegistryPreviewSourceFile;
};

export const registryItems = registryItemModuleEntries.map(toRegistryCatalogItem);

function toRegistryCatalogItem(entry: RegistryItemModuleEntry): RegistryCatalogItem {
  const itemRoot = getParentPath(entry.path);
  const sourceFileDefinitions = getRegistrySourceFileDefinitions(itemRoot, entry.registryItem);
  const sourceFileDefinitionsByPath = new Map(
    sourceFileDefinitions.map((file) => [file.path, file]),
  );
  const item = toRegistryItemDefinition(entry.registryItem, sourceFileDefinitions);

  return {
    ...item,
    sourceFiles: item.files.map((file) =>
      toRegistrySourceFile(itemRoot, file, sourceFileDefinitionsByPath.get(file.path) ?? file),
    ),
    previewSourceFile: getPreviewSourceFile(entry.path),
  };
}

function getRegistrySourceFileDefinitions(
  itemRoot: string,
  item: RegistryItemAuthoringDefinition,
): RegistrySourceFileDefinition[] {
  return item.files ?? [getDefaultRegistryFile(itemRoot, item)];
}

function getDefaultRegistryFile(
  itemRoot: string,
  item: Pick<RegistryItemAuthoringDefinition, "name" | "type">,
): RegistrySourceFileDefinition {
  if (item.type === "registry:file" || item.type === "registry:page") {
    throw new Error(`Registry item "${item.name}" must define files explicitly.`);
  }

  return {
    path: `${itemRoot}/${item.name}.tsx`,
    type: item.type,
  };
}

function toRegistryItemDefinition(
  item: RegistryItemAuthoringDefinition,
  files: RegistrySourceFileDefinition[],
): RegistryItemDefinition {
  return {
    ...item,
    files: files.map(toRegistryFileDefinition),
  };
}

function toRegistryFileDefinition(file: RegistrySourceFileDefinition): RegistryFileDefinition {
  const { sourcePath: _sourcePath, ...registryFile } = file;

  return registryFile;
}

export function getRegistryItem(name: string): RegistryCatalogItem | undefined {
  return registryItems.find((item) => item.name === name);
}

export function getRegistryItemsByType(type: RegistryType): RegistryCatalogItem[] {
  return registryItems.filter((item) => item.type === type);
}

export function getRegistryItemsByTypes(types: readonly RegistryType[]): RegistryCatalogItem[] {
  const typeSet = new Set(types);

  return registryItems.filter((item) => typeSet.has(item.type));
}

function normalizeGlobFiles<T>(files: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(files).map(([path, source]) => [normalizeGlobPath(path), source]),
  );
}

function normalizeGlobPath(path: string): string {
  return path.replace(/^(?:\.\.\/){3}/u, "");
}

function compareRegistryItemNames(
  a: Pick<RegistryItemDefinition, "name" | "title">,
  b: Pick<RegistryItemDefinition, "name" | "title">,
): number {
  return (
    registryItemCollator.compare(a.title, b.title) || registryItemCollator.compare(a.name, b.name)
  );
}

function getPreviewSourceFile(path: string): RegistryPreviewSourceFile {
  return {
    path,
    fileName: getFileName(path),
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
