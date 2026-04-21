import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { parse as parseYaml } from "yaml";

export type MdxAstNode = {
  type: string;
  value?: string;
  name?: string;
  depth?: number;
  children?: MdxAstNode[];
  position?: {
    start?: {
      offset?: number;
    };
    end?: {
      offset?: number;
    };
  };
};

type ContentDiagnosticInput = {
  label: string;
  path: string;
};

function createMdxProcessor() {
  return unified().use(remarkParse).use(remarkMdx).use(remarkFrontmatter, ["yaml"]).use(remarkGfm);
}

const mdxProcessor = createMdxProcessor();

export function parseMdxAst({
  label,
  path,
  source,
}: ContentDiagnosticInput & { source: string }): MdxAstNode {
  try {
    const root = mdxProcessor.parse(source);

    if (!isMdxAstNode(root)) {
      throw new Error("Parsed MDX did not produce a valid document tree.");
    }

    return root;
  } catch (error) {
    throw new Error(`${label} ${path} contains invalid MDX: ${getErrorMessage(error)}`, {
      cause: error,
    });
  }
}

export function parseYamlFrontmatter({
  label,
  path,
  source,
}: ContentDiagnosticInput & { source: string }): unknown {
  try {
    return parseYaml(source);
  } catch (error) {
    throw new Error(
      `${label} ${path} contains invalid YAML frontmatter: ${getErrorMessage(error)}`,
      { cause: error },
    );
  }
}

export function getFirstYamlFrontmatterNode(root: MdxAstNode): MdxAstNode | undefined {
  const frontmatter = root.children?.[0];

  return frontmatter?.type === "yaml" ? frontmatter : undefined;
}

export function getFrontmatterSource(root: MdxAstNode): string {
  return getFirstYamlFrontmatterNode(root)?.value ?? "";
}

export function getMdxNodesSource(nodes: readonly MdxAstNode[], source: string): string {
  const startOffset = nodes[0]?.position?.start?.offset;
  const endOffset = nodes.at(-1)?.position?.end?.offset;

  if (typeof startOffset !== "number" || typeof endOffset !== "number") {
    return "";
  }

  return source.slice(startOffset, endOffset).trim();
}

export function getOptionalStringField(
  { label, path }: ContentDiagnosticInput,
  value: Record<string, unknown>,
  field: string,
): string | undefined {
  const fieldValue = value[field];

  if (fieldValue === undefined) {
    return undefined;
  }

  if (typeof fieldValue === "string") {
    return fieldValue;
  }

  throw new Error(`${label} ${path} frontmatter field "${field}" must be a string.`);
}

export function getOptionalNumberField(
  { label, path }: ContentDiagnosticInput,
  value: Record<string, unknown>,
  field: string,
): number | undefined {
  const fieldValue = value[field];

  if (fieldValue === undefined) {
    return undefined;
  }

  if (typeof fieldValue === "number" && Number.isFinite(fieldValue)) {
    return fieldValue;
  }

  throw new Error(`${label} ${path} frontmatter field "${field}" must be a number.`);
}

export function getRequiredStringField(
  { label, path }: ContentDiagnosticInput,
  value: Record<string, unknown>,
  field: string,
): string {
  const fieldValue = value[field];

  if (typeof fieldValue !== "string" || fieldValue.length === 0) {
    throw new Error(`${label} ${path} frontmatter field "${field}" must be a string.`);
  }

  return fieldValue;
}

export function assertOptionalStringField(
  diagnostic: ContentDiagnosticInput,
  value: Record<string, unknown>,
  field: string,
): void {
  getOptionalStringField(diagnostic, value, field);
}

export function assertOptionalStringArrayField(
  { label, path }: ContentDiagnosticInput,
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

  throw new Error(`${label} ${path} frontmatter field "${field}" must be a string array.`);
}

function isMdxAstNode(value: unknown): value is MdxAstNode {
  return isRecord(value) && typeof value.type === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
