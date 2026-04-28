import {
  assertOptionalStringArrayField,
  assertOptionalStringField,
  getFirstYamlFrontmatterNode,
  getOptionalStringField,
  getRequiredStringField,
  parseYamlFrontmatter,
  type MdxAstNode,
} from "../content/mdx";
import { getCanonicalRegistryItemUrl } from "../site-config";
import { isPublicRegistryItemType } from "./item-types";
import { getRegistryMdxSections, parseRegistryMdxAst } from "./mdx-ast";
import type { RegistryItemAuthoringDefinition, RegistrySourceFileDefinition } from "./metadata";

type RegistryMdxFrontmatter = RegistryItemAuthoringDefinition & {
  localRegistryDependencies?: string[];
};

type ParsedRegistryMdx = {
  registryItem: RegistryItemAuthoringDefinition;
  hasPreview: boolean;
  previewSource: string;
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
  const frontmatter = getFrontmatterNode(path, root);
  const metadata = parseRegistryMdxFrontmatter(path, frontmatter.value ?? "");
  const sections = getRegistryMdxSections(path, root, source);

  return {
    registryItem: toRegistryItemAuthoringDefinition(metadata),
    hasPreview: sections.hasPreview,
    previewSource: sections.previewSource,
    hasUsage: sections.hasUsage,
    usageSource: sections.usageSource,
  };
}

function getFrontmatterNode(path: string, root: MdxAstNode): MdxAstNode {
  const frontmatter = getFirstYamlFrontmatterNode(root);

  if (!frontmatter) {
    throw new Error(`Registry item ${path} must start with YAML frontmatter.`);
  }

  return frontmatter;
}

function parseRegistryMdxFrontmatter(path: string, frontmatter: string): RegistryMdxFrontmatter {
  const value = parseYamlFrontmatter({
    label: "Registry item",
    path,
    source: frontmatter,
  });

  if (!isRecord(value)) {
    throw new Error(`Registry item ${path} frontmatter must be an object.`);
  }

  assertRegistryMdxFrontmatter(path, value);

  return value;
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

function isRegistrySourceFileDefinition(value: unknown): value is RegistrySourceFileDefinition {
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
    (value.sourcePath === undefined || typeof value.sourcePath === "string") &&
    (value.target === undefined || typeof value.target === "string")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
