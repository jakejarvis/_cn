import {
  assertNoMdxEsm,
  assertOptionalStringArrayField,
  assertOptionalStringField,
  getMdxBodySource,
  getOptionalStringField,
  getRequiredFrontmatterSource,
  getRequiredStringField,
  parseMdxAst,
  parseYamlFrontmatterObject,
  type MdxAstNode,
} from "../content/mdx.ts";
import { getCanonicalRegistryItemUrl } from "../site-config.ts";
import { isPublicRegistryItemType } from "./item-types.ts";
import type { RegistryFileAuthoringDefinition, RegistryItemAuthoringDefinition } from "./metadata";

type RegistryMdxFrontmatter = RegistryItemAuthoringDefinition & {
  localRegistryDependencies?: string[];
};

export type ParsedRegistryMdx = {
  registryItem: RegistryItemAuthoringDefinition;
  hasUsage: boolean;
  usageSource: string;
};

const knownFrontmatterFields = new Set([
  "$schema",
  "author",
  "categories",
  "config",
  "css",
  "cssVars",
  "dependencies",
  "description",
  "devDependencies",
  "docs",
  "envVars",
  "extends",
  "files",
  "font",
  "localRegistryDependencies",
  "meta",
  "name",
  "registryDependencies",
  "tailwind",
  "title",
  "type",
]);

const optionalStringFields = ["$schema", "author", "docs", "extends"] as const;
const optionalStringArrayFields = [
  "categories",
  "dependencies",
  "devDependencies",
  "localRegistryDependencies",
  "registryDependencies",
] as const;

export function parseRegistryMdx(path: string, source: string): ParsedRegistryMdx {
  const root = parseRegistryMdxAst(path, source);
  const metadata = parseRegistryMdxFrontmatter(
    path,
    getRequiredFrontmatterSource({ label: "Registry item", path, root }),
  );
  const usageSource = getRegistryMdxUsageSource(path, root, source);

  return createParsedRegistryMdx(metadata, usageSource);
}

export function parseRegistryMdxDocument(
  path: string,
  metadata: Record<string, unknown>,
  usageSource: string,
): ParsedRegistryMdx {
  assertRegistryMdxFrontmatter(path, metadata);
  const root = parseRegistryMdxAst(path, usageSource);
  const parsedUsageSource = getRegistryMdxUsageSource(path, root, usageSource);

  return createParsedRegistryMdx(metadata, parsedUsageSource);
}

export function parseRegistryMdxMetadataDocument(
  path: string,
  metadata: Record<string, unknown>,
): RegistryItemAuthoringDefinition {
  assertRegistryMdxFrontmatter(path, metadata);

  return toRegistryItemAuthoringDefinition(metadata);
}

function createParsedRegistryMdx(
  metadata: RegistryMdxFrontmatter,
  usageSource: string,
): ParsedRegistryMdx {
  return {
    registryItem: toRegistryItemAuthoringDefinition(metadata),
    hasUsage: usageSource.length > 0,
    usageSource,
  };
}

function parseRegistryMdxAst(path: string, source: string): MdxAstNode {
  return parseMdxAst({ label: "Registry item", path, source });
}

function parseRegistryMdxFrontmatter(path: string, frontmatter: string): RegistryMdxFrontmatter {
  const value = parseYamlFrontmatterObject({
    label: "Registry item",
    path,
    source: frontmatter,
  });

  assertRegistryMdxFrontmatter(path, value);

  return value;
}

function getRegistryMdxUsageSource(path: string, root: MdxAstNode, source: string): string {
  assertNoMdxEsm(
    root,
    `Registry item ${path} must not contain MDX imports or exports. Put interactive previews in _preview.tsx.`,
  );

  return getMdxBodySource(root, source);
}

function assertRegistryMdxFrontmatter(
  path: string,
  value: Record<string, unknown>,
): asserts value is RegistryMdxFrontmatter {
  const diagnostic = { label: "Registry item", path };
  const unknownFields = Object.keys(value).filter((field) => !knownFrontmatterFields.has(field));

  if (unknownFields.length > 0) {
    throw new Error(
      `Registry item ${path} has unsupported frontmatter field(s): ${unknownFields.join(", ")}.`,
    );
  }

  getRequiredStringField(diagnostic, value, "name");
  const type = getRequiredStringField(diagnostic, value, "type");
  getOptionalStringField(diagnostic, value, "title");
  getOptionalStringField(diagnostic, value, "description");

  if (!isPublicRegistryItemType(type)) {
    throw new Error(`Registry item ${path} has unsupported type "${type}".`);
  }

  for (const field of optionalStringFields) {
    assertOptionalStringField(diagnostic, value, field);
  }

  for (const field of optionalStringArrayFields) {
    assertOptionalStringArrayField(diagnostic, value, field);
  }

  assertBaseConfigField(path, value, type);
  assertFontField(path, value, type);
  assertOptionalRegistryFiles(path, value);
}

function assertBaseConfigField(path: string, value: Record<string, unknown>, type: string): void {
  if (value.config !== undefined && type !== "registry:base") {
    throw new Error(
      `Registry item ${path} field "config" is only supported for registry:base items.`,
    );
  }
}

function assertFontField(path: string, value: Record<string, unknown>, type: string): void {
  if (type === "registry:font" && value.font === undefined) {
    throw new Error(`Registry item ${path} of type registry:font must include font metadata.`);
  }

  if (type !== "registry:font" && value.font !== undefined) {
    throw new Error(
      `Registry item ${path} must not include font metadata unless type is registry:font.`,
    );
  }
}

function toRegistryItemAuthoringDefinition(
  metadata: RegistryMdxFrontmatter,
): RegistryItemAuthoringDefinition {
  const { localRegistryDependencies, ...item } = metadata;
  const registryDependencies = [
    ...(item.registryDependencies ?? []),
    ...(localRegistryDependencies ?? []).map(getCanonicalRegistryItemUrl),
  ];

  if (registryDependencies.length === 0) {
    return item;
  }

  return {
    ...item,
    registryDependencies: [...new Set(registryDependencies)],
  };
}

function assertOptionalRegistryFiles(path: string, value: Record<string, unknown>): void {
  const files = value.files;

  if (files === undefined) {
    return;
  }

  if (!Array.isArray(files)) {
    throw new Error(`Registry item ${path} frontmatter field "files" must be an array.`);
  }

  for (const file of files) {
    if (!isRegistrySourceFileDefinition(file)) {
      throw new Error(`Registry item ${path} contains an invalid file entry.`);
    }
  }
}

function isRegistrySourceFileDefinition(value: unknown): value is RegistryFileAuthoringDefinition {
  if (!isRecord(value)) {
    return false;
  }

  if (typeof value.path !== "string" || typeof value.type !== "string") {
    return false;
  }

  if (!isPublicRegistryItemType(value.type)) {
    return false;
  }

  return (
    value.sourcePath === undefined &&
    (value.target === undefined || typeof value.target === "string")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
