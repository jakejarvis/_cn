import {
  registryItemSchema as shadcnRegistryItemSchema,
  registrySchema as shadcnRegistrySchema,
} from "shadcn/schema";

import { getRegistryItem, registryItems } from "./catalog";
import type { RegistryCatalogItem } from "./catalog-builder";
import { getRegistryDisplaySource } from "./display-source.server";
import {
  registryConfig,
  registryItemSchema,
  type RegistryFileDefinition,
  type RegistryItemDefinition,
} from "./metadata";
import { getFileName, isInvalidRegistryRelativePath } from "./paths";
import { getRegistryItemWithSources, type RegistryCatalogItemWithSources } from "./source.server";

const registryJsonResponseHeaders = {
  "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
} as const;

type RegistryIndexJson = typeof registryConfig & {
  items: RegistryItemDefinition[];
};

type RegistryItemFileJson = RegistryFileDefinition & {
  content: string;
};

type RegistryItemJson = Omit<RegistryItemDefinition, "files"> & {
  $schema: typeof registryItemSchema;
  files?: RegistryItemFileJson[];
};

type RegistryItemOptionalFields = Pick<
  RegistryItemDefinition,
  | "author"
  | "dependencies"
  | "devDependencies"
  | "registryDependencies"
  | "tailwind"
  | "cssVars"
  | "css"
  | "envVars"
  | "font"
  | "docs"
  | "categories"
  | "meta"
  | "extends"
  | "config"
>;

const registryItemOptionalFieldNames = [
  "author",
  "dependencies",
  "devDependencies",
  "registryDependencies",
  "tailwind",
  "cssVars",
  "css",
  "envVars",
  "font",
  "docs",
  "categories",
  "meta",
  "extends",
  "config",
] as const satisfies readonly (keyof RegistryItemOptionalFields)[];

type RegistrySourceValidationItem = {
  name: string;
  sourceFiles: {
    source: string;
    sourcePath: string;
  }[];
};

export function getRegistryIndexJsonResponse(): Response {
  return Response.json(getRegistryIndexJson(), {
    headers: registryJsonResponseHeaders,
  });
}

export function getRegistryItemJsonResponse(name: string): Response {
  const item = getRegistryItemJson(name);

  if (!item) {
    return Response.json(
      { error: "Registry item not found." },
      {
        headers: registryJsonResponseHeaders,
        status: 404,
      },
    );
  }

  return Response.json(item, {
    headers: registryJsonResponseHeaders,
  });
}

export function getRegistryIndexJson(): RegistryIndexJson {
  return {
    ...registryConfig,
    items: registryItems.map(toRegistryItemDefinition),
  };
}

export function getRegistryItemJson(name: string): RegistryItemJson | null {
  const item = getRegistryItem(name);

  return item ? toRegistryItemJson(item) : null;
}

export function getRegistryValidationErrors(): string[] {
  const names = new Map<string, string>();
  const registryItemNames = new Set(registryItems.map((item) => item.name));
  const errors = getRegistrySchemaValidationErrors();

  for (const item of registryItems) {
    errors.push(...getRegistryItemValidationErrors(item, names, registryItemNames));
  }

  return errors;
}

function getRegistrySchemaValidationErrors(): string[] {
  const parseResult = shadcnRegistrySchema.safeParse(getRegistryIndexJson());

  if (parseResult.success) {
    return [];
  }

  return parseResult.error.issues.map(
    (issue) => `Registry index schema error: ${formatSchemaIssue(issue)}`,
  );
}

function getRegistryItemValidationErrors(
  item: RegistryCatalogItem,
  names: Map<string, string>,
  registryItemNames: Set<string>,
): string[] {
  const itemWithSources = getRegistryItemWithSources(item);

  return [
    ...getRegistryItemMetadataErrors(item, names),
    ...getRegistryDependencyErrors(item, registryItemNames),
    ...getRegistryFileValidationErrors(item),
    ...getRegistrySourceValidationErrors(itemWithSources),
    ...getRegistryItemSchemaValidationErrors(item, itemWithSources),
  ];
}

function getRegistryItemMetadataErrors(
  item: RegistryCatalogItem,
  names: Map<string, string>,
): string[] {
  const errors: string[] = [];
  const existingName = names.get(item.name);

  if (existingName) {
    errors.push(`Duplicate registry item name "${item.name}" in ${existingName} and ${item.name}.`);
  }

  names.set(item.name, item.name);

  if (!item.name || !item.type) {
    errors.push(`Registry item "${item.name}" has incomplete metadata.`);
  }

  if (item.type === "registry:font" && !item.font) {
    errors.push(`Registry item "${item.name}" must include font metadata.`);
  }

  if (item.type !== "registry:font" && item.font) {
    errors.push(`Registry item "${item.name}" must not include font metadata.`);
  }

  return errors;
}

function getRegistryDependencyErrors(
  item: RegistryCatalogItem,
  registryItemNames: Set<string>,
): string[] {
  const errors: string[] = [];

  for (const registryDependency of item.registryDependencies ?? []) {
    if (registryItemNames.has(registryDependency)) {
      errors.push(
        `Registry item "${item.name}" must use a URL for local registry dependency "${registryDependency}".`,
      );
    }
  }

  return errors;
}

function getRegistryFileValidationErrors(item: RegistryCatalogItem): string[] {
  const errors: string[] = [];

  for (const file of item.sourceFiles) {
    const fileName = getFileName(file.path);
    const sourceFileName = getFileName(file.sourcePath);

    if (isInvalidRegistryRelativePath(file.path)) {
      errors.push(`Registry item "${item.name}" contains an invalid install path: ${file.path}`);
    }

    if (isInvalidRegistryRelativePath(file.sourcePath)) {
      errors.push(
        `Registry item "${item.name}" contains an invalid source path: ${file.sourcePath}`,
      );
    } else if (!file.sourcePath.startsWith("registry/items/")) {
      errors.push(
        `Registry item "${item.name}" must publish files from registry/items/: ${file.sourcePath}`,
      );
    }

    if (fileName.startsWith("_")) {
      errors.push(`Registry item "${item.name}" must not publish registry authoring files.`);
    }

    if (sourceFileName.startsWith("_")) {
      errors.push(
        `Registry item "${item.name}" must not publish from registry authoring source files: ${file.sourcePath}`,
      );
    }

    if ((file.type === "registry:file" || file.type === "registry:page") && !file.target) {
      errors.push(`Registry item "${item.name}" file ${file.path} must include target.`);
    }
  }

  return errors;
}

export function getRegistrySourceValidationErrors(item: RegistrySourceValidationItem): string[] {
  const errors: string[] = [];

  for (const file of item.sourceFiles) {
    if (file.sourcePath.trim().length === 0) {
      errors.push(
        `Registry item "${item.name}" references an unsupported source file type: ${file.sourcePath}`,
      );
      continue;
    }

    if (file.source.length === 0) {
      errors.push(`Registry item "${item.name}" references a missing file: ${file.sourcePath}`);
    }
  }

  return errors;
}

function getRegistryItemSchemaValidationErrors(
  item: RegistryCatalogItem,
  itemWithSources: RegistryCatalogItemWithSources,
): string[] {
  try {
    const parseResult = shadcnRegistryItemSchema.safeParse(
      toRegistryItemJson(item, itemWithSources),
    );

    if (parseResult.success) {
      return [];
    }

    return parseResult.error.issues.map(
      (issue) => `Registry item "${item.name}" schema error: ${formatSchemaIssue(issue)}`,
    );
  } catch (error) {
    return [
      `Registry item "${item.name}" could not be built for schema validation: ${getErrorMessage(error)}`,
    ];
  }
}

function toRegistryItemJson(
  item: RegistryCatalogItem,
  itemWithSources = getRegistryItemWithSources(item),
): RegistryItemJson {
  const unsupportedFiles = itemWithSources.sourceFiles
    .filter((file) => file.sourcePath.trim().length === 0)
    .map((file) => file.sourcePath);
  const missingFiles = itemWithSources.sourceFiles
    .filter((file) => file.sourcePath.trim().length > 0 && file.source.length === 0)
    .map((file) => file.sourcePath);

  if (unsupportedFiles.length > 0) {
    throw new Error(`Unsupported registry source file type(s): ${unsupportedFiles.join(", ")}`);
  }

  if (missingFiles.length > 0) {
    throw new Error(`Missing registry source file(s): ${missingFiles.join(", ")}`);
  }

  const files = itemWithSources.sourceFiles.map((file) =>
    toRegistryItemFileJson(itemWithSources, file),
  );

  return {
    $schema: registryItemSchema,
    name: item.name,
    title: item.title,
    description: item.description,
    ...(files.length > 0 ? { files } : {}),
    type: item.type,
    ...getRegistryItemOptionalFields(item),
  };
}

function toRegistryItemDefinition(item: RegistryCatalogItem): RegistryItemDefinition {
  return {
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
    ...(item.files.length > 0 ? { files: item.files } : {}),
    ...getRegistryItemOptionalFields(item),
  };
}

function getRegistryItemOptionalFields(
  item: RegistryCatalogItem,
): Partial<RegistryItemOptionalFields> {
  const optionalFields: Partial<RegistryItemOptionalFields> = {};

  for (const field of registryItemOptionalFieldNames) {
    const value = item[field];

    if (value !== undefined) {
      Object.assign(optionalFields, { [field]: value });
    }
  }

  return optionalFields;
}

function toRegistryItemFileJson(
  item: RegistryCatalogItemWithSources,
  file: RegistryCatalogItem["sourceFiles"][number] & { source: string },
): RegistryItemFileJson {
  const content = getRegistryDisplaySource(item, file);

  if (file.type === "registry:file" || file.type === "registry:page") {
    if (!file.target) {
      throw new Error(`Registry file ${file.path} must include target.`);
    }

    return {
      path: file.path,
      type: file.type,
      content,
      target: file.target,
    };
  }

  const registryFile = {
    path: file.path,
    type: file.type,
    content,
  };

  if (file.target) {
    return {
      ...registryFile,
      target: file.target,
    };
  }

  return registryFile;
}

function formatSchemaIssue(issue: { path: (string | number)[]; message: string }): string {
  const path = issue.path.length > 0 ? issue.path.join(".") : "<root>";

  return `${path}: ${issue.message}`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
