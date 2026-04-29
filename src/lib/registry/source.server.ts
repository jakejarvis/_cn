import { normalizeGlobFiles } from "../glob";
import { registryItems } from "./catalog";
import type { RegistryCatalogItem, RegistryPreviewSourceFile } from "./catalog-builder";

const registrySources = import.meta.glob<string>("../../../registry/items/**/*", {
  eager: true,
  import: "default",
  query: "?raw",
});

const registrySourceByPath = normalizeGlobFiles(registrySources);

export type RegistrySourceFileWithSource = RegistryCatalogItem["sourceFiles"][number] & {
  source: string;
};

export type RegistryPreviewSourceFileWithSource = RegistryPreviewSourceFile & {
  source: string;
};

export type RegistryCatalogItemWithSources = Omit<
  RegistryCatalogItem,
  "previewSourceFile" | "sourceFiles"
> & {
  previewSourceFile: RegistryPreviewSourceFileWithSource;
  sourceFiles: RegistrySourceFileWithSource[];
};

export function getRegistryItemWithSources(
  item: RegistryCatalogItem,
): RegistryCatalogItemWithSources {
  return {
    ...item,
    sourceFiles: item.sourceFiles.map((file) => ({
      ...file,
      source: getRegistrySource(file.sourcePath),
    })),
    previewSourceFile: {
      ...item.previewSourceFile,
      source: trimBlankTrailingLines(item.previewSourceFile.source),
    },
  };
}

export function getMissingRegistrySourcePaths(): string[] {
  return registryItems.flatMap((item) =>
    getRegistryItemWithSources(item)
      .sourceFiles.filter((file) => file.source.length === 0)
      .map((file) => file.sourcePath),
  );
}

export function getMissingRegistryPreviewPaths(): string[] {
  return registryItems.flatMap((item) => {
    const itemWithSources = getRegistryItemWithSources(item);

    return item.hasPreview && itemWithSources.previewSourceFile.source.length === 0
      ? [itemWithSources.previewSourceFile.path]
      : [];
  });
}

export function getUnsupportedRegistrySourcePaths(): string[] {
  return registryItems.flatMap((item) =>
    item.sourceFiles
      .filter((file) => file.sourcePath.trim().length === 0)
      .map((file) => file.sourcePath),
  );
}

export function trimBlankTrailingLines(source: string): string {
  const lines = source.split(/\r?\n/u);

  while (lines.length > 0 && lines[lines.length - 1]?.trim() === "") {
    lines.pop();
  }

  return lines.join("\n");
}

function getRegistrySource(path: string): string {
  if (path.trim().length === 0) {
    return "";
  }

  const source = registrySourceByPath[path];

  return source ? trimBlankTrailingLines(source) : "";
}
