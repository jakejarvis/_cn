import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { parse as parseYaml } from "yaml";

import { getCanonicalRegistryItemUrl } from "@/lib/site-config";

import type { RegistryItemAuthoringDefinition, RegistrySourceFileDefinition } from "./metadata";

type RegistryMdxFrontmatter = RegistryItemAuthoringDefinition & {
  localRegistryDependencies?: string[];
};

type MdxAstNode = {
  type: string;
  value?: string;
  children?: MdxAstNode[];
};

export type ParsedRegistryMdx = {
  registryItem: RegistryItemAuthoringDefinition;
  previewSource: string;
  hasUsage: boolean;
};

const registryMdxProcessor = unified()
  .use(remarkParse)
  .use(remarkMdx)
  .use(remarkFrontmatter, ["yaml"])
  .use(remarkGfm);

const registryItemTypes = new Set([
  "registry:lib",
  "registry:block",
  "registry:component",
  "registry:ui",
  "registry:hook",
  "registry:page",
  "registry:file",
  "registry:theme",
  "registry:style",
  "registry:item",
  "registry:base",
  "registry:font",
]);

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

  return {
    registryItem: toRegistryItemAuthoringDefinition(metadata),
    previewSource: getPreviewSource(root),
    hasUsage: hasUsageContent(root),
  };
}

function parseRegistryMdxAst(path: string, source: string): MdxAstNode {
  try {
    return registryMdxProcessor.parse(source) as MdxAstNode;
  } catch (error) {
    throw new Error(`Registry item ${path} contains invalid MDX: ${getErrorMessage(error)}`, {
      cause: error,
    });
  }
}

function getFrontmatterNode(path: string, root: MdxAstNode): MdxAstNode {
  const frontmatter = root.children?.[0];

  if (frontmatter?.type !== "yaml") {
    throw new Error(`Registry item ${path} must start with YAML frontmatter.`);
  }

  return frontmatter;
}

function parseRegistryMdxFrontmatter(path: string, frontmatter: string): RegistryMdxFrontmatter {
  const value = parseYaml(frontmatter);

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
  const unknownFields = Object.keys(value).filter((field) => !knownFrontmatterFields.has(field));

  if (unknownFields.length > 0) {
    throw new Error(
      `Registry item ${path} has unsupported frontmatter field(s): ${unknownFields.join(", ")}.`,
    );
  }

  getStringField(path, value, "name");
  const type = getStringField(path, value, "type");
  getStringField(path, value, "title");
  getStringField(path, value, "description");

  if (!registryItemTypes.has(type)) {
    throw new Error(`Registry item ${path} has unsupported type "${type}".`);
  }

  for (const field of optionalStringFields) {
    assertOptionalStringField(path, value, field);
  }

  for (const field of optionalStringArrayFields) {
    assertOptionalStringArray(path, value, field);
  }

  assertOptionalRegistryFiles(path, value);
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

function getPreviewSource(root: MdxAstNode): string {
  return (
    root.children
      ?.filter((node) => node.type === "mdxjsEsm")
      .map((node) => node.value?.trim() ?? "")
      .filter(Boolean)
      .join("\n\n") ?? ""
  );
}

function hasUsageContent(root: MdxAstNode): boolean {
  return root.children?.some((node) => node.type !== "yaml" && node.type !== "mdxjsEsm") ?? false;
}

function getStringField(path: string, value: Record<string, unknown>, field: string): string {
  const fieldValue = value[field];

  if (typeof fieldValue !== "string" || fieldValue.length === 0) {
    throw new Error(`Registry item ${path} frontmatter field "${field}" must be a string.`);
  }

  return fieldValue;
}

function assertOptionalStringField(
  path: string,
  value: Record<string, unknown>,
  field: string,
): void {
  const fieldValue = value[field];

  if (fieldValue === undefined || typeof fieldValue === "string") {
    return;
  }

  throw new Error(`Registry item ${path} frontmatter field "${field}" must be a string.`);
}

function assertOptionalStringArray(
  path: string,
  value: Record<string, unknown>,
  field: string,
): void {
  const fieldValue = value[field];

  if (fieldValue === undefined) {
    return;
  }

  if (Array.isArray(fieldValue) && fieldValue.every((item) => typeof item === "string")) {
    return;
  }

  throw new Error(`Registry item ${path} frontmatter field "${field}" must be a string array.`);
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

  if (!registryItemTypes.has(value.type)) {
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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
