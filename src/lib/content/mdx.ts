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

type MdxDocumentDiagnosticInput = ContentDiagnosticInput & {
  root: MdxAstNode;
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

export function getRequiredFrontmatterSource({
  label,
  path,
  root,
}: MdxDocumentDiagnosticInput): string {
  const frontmatter = getFirstYamlFrontmatterNode(root);

  if (!frontmatter) {
    throw new Error(`${label} ${path} must start with YAML frontmatter.`);
  }

  return frontmatter.value ?? "";
}

function getMdxNodesSource(nodes: readonly MdxAstNode[], source: string): string {
  const startOffset = nodes[0]?.position?.start?.offset;
  const endOffset = nodes.at(-1)?.position?.end?.offset;

  if (typeof startOffset !== "number" || typeof endOffset !== "number") {
    return "";
  }

  return source.slice(startOffset, endOffset).trim();
}

function getMdxBodyNodes(root: MdxAstNode): MdxAstNode[] {
  return root.children?.filter((node) => node.type !== "yaml") ?? [];
}

export function getMdxBodySource(root: MdxAstNode, source: string): string {
  return getMdxNodesSource(getMdxBodyNodes(root), source);
}

export function assertNoMdxEsm(root: MdxAstNode, message: string): void {
  if (getMdxBodyNodes(root).some((node) => node.type === "mdxjsEsm")) {
    throw new Error(message);
  }
}

export function getUnsupportedMdxComponentNames(
  root: MdxAstNode,
  allowedComponents: ReadonlySet<string>,
): string[] {
  const names = new Set<string>();
  const visit = (node: MdxAstNode) => {
    if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") {
      const name = node.name ?? "<>";

      if (!allowedComponents.has(name)) {
        names.add(name);
      }
    }

    for (const child of node.children ?? []) {
      visit(child);
    }
  };

  visit(root);

  return [...names].toSorted();
}

export function getFirstHeadingText(root: MdxAstNode): string | undefined {
  const heading = root.children?.find((node) => node.type === "heading" && node.depth === 1);
  const text = heading ? getNodeText(heading).trim() : "";

  return text || undefined;
}

export function parseYamlFrontmatterObject(
  input: ContentDiagnosticInput & { source: string },
): Record<string, unknown> {
  const value = parseYamlFrontmatter(input);

  if (!isRecord(value)) {
    throw new Error(`${input.label} ${input.path} frontmatter must be an object.`);
  }

  return value;
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

function getNodeText(node: MdxAstNode): string {
  if (node.value) {
    return node.value;
  }

  return node.children?.map(getNodeText).join("") ?? "";
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
