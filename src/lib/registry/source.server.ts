import { registryItems, type RegistryCatalogItem, type RegistryPreviewSourceFile } from "./catalog";

const registrySources = import.meta.glob<string>("../../../registry/items/**/*.{ts,tsx}", {
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
      source: getRegistryPreviewDisplaySource(getRegistrySource(item.previewSourceFile.path)),
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

    return itemWithSources.previewSourceFile.source.length === 0
      ? [itemWithSources.previewSourceFile.path]
      : [];
  });
}

function normalizeGlobFiles<T>(files: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(files).map(([path, source]) => [normalizeGlobPath(path), source]),
  );
}

function getRegistrySource(path: string): string {
  const source = registrySourceByPath[path];

  return source ? trimBlankTrailingLines(source) : "";
}

export function getRegistryPreviewDisplaySource(source: string): string {
  const withoutMetadataImport = source.replace(
    /^import\s+\{[^}]*\bdefineRegistryItem\b[^}]*\}\s+from\s+"@\/lib\/registry\/metadata";\n\n?/mu,
    "",
  );
  const withoutRegistryItem = withoutMetadataImport.replace(
    /^export const registryItem = defineRegistryItem\(\{[\s\S]*?^\}\);\n\n?/mu,
    "",
  );

  return trimBlankTrailingLines(withoutRegistryItem.replace(/\n{3,}/gu, "\n\n"));
}

export function trimBlankTrailingLines(source: string): string {
  const lines = source.split(/\r?\n/u);

  while (lines.length > 0 && lines[lines.length - 1]?.trim() === "") {
    lines.pop();
  }

  return lines.join("\n");
}

function normalizeGlobPath(path: string): string {
  return path.replace(/^(?:\.\.\/){3}/u, "");
}
