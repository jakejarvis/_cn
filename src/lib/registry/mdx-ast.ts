import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";

export type MdxAstNode = {
  type: string;
  value?: string;
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

export type RegistryMdxSections = {
  previewSource: string;
  hasUsage: boolean;
  usageSource: string;
};

const registryMdxProcessor = unified()
  .use(remarkParse)
  .use(remarkMdx)
  .use(remarkFrontmatter, ["yaml"])
  .use(remarkGfm);

export function parseRegistryMdxAst(path: string, source: string): MdxAstNode {
  try {
    return registryMdxProcessor.parse(source) as MdxAstNode;
  } catch (error) {
    throw new Error(`Registry item ${path} contains invalid MDX: ${getErrorMessage(error)}`, {
      cause: error,
    });
  }
}

export function getRegistryMdxSections(
  path: string,
  root: MdxAstNode,
  source: string,
): RegistryMdxSections {
  const children = root.children ?? [];
  const previewIndex = children.findIndex(isPreviewExportNode);

  if (previewIndex === -1) {
    throw new Error(`Registry item ${path} must export a Preview function.`);
  }

  const leadingNodes = children.slice(0, previewIndex);
  const trailingNodes = children.slice(previewIndex + 1);
  const usageStartIndex = leadingNodes.findIndex(
    (node) => node.type !== "yaml" && !isEsmNode(node),
  );
  const setupNodes = usageStartIndex === -1 ? leadingNodes : leadingNodes.slice(0, usageStartIndex);
  const usageNodes = usageStartIndex === -1 ? [] : leadingNodes.slice(usageStartIndex);

  if (setupNodes.some((node) => node.type !== "yaml" && !isEsmNode(node))) {
    throw new Error(`Registry item ${path} must put preview imports before the Usage section.`);
  }

  if (usageNodes.some(isEsmNode)) {
    throw new Error(
      `Registry item ${path} must not contain MDX imports or exports inside the Usage section.`,
    );
  }

  if (trailingNodes.length > 0) {
    throw new Error(`Registry item ${path} must not contain content after the Preview export.`);
  }

  return {
    previewSource: getEsmSource([...setupNodes, children[previewIndex]].filter(isEsmNode)),
    hasUsage: usageNodes.length > 0,
    usageSource: getNodesSource(usageNodes, source),
  };
}

export function getMdxEsmSource(root: MdxAstNode): string {
  return getEsmSource(root.children?.filter(isEsmNode) ?? []);
}

export function hasMdxUsageContent(root: MdxAstNode): boolean {
  return (root.children ?? []).some((node) => node.type !== "yaml" && !isEsmNode(node));
}

export function getMdxUsageSource(root: MdxAstNode, source: string): string {
  return getNodesSource(
    root.children?.filter((node) => node.type !== "yaml" && !isEsmNode(node)) ?? [],
    source,
  );
}

function getEsmSource(nodes: MdxAstNode[]): string {
  return nodes
    .map((node) => node.value?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n");
}

function getNodesSource(nodes: MdxAstNode[], source: string): string {
  const startOffset = nodes[0]?.position?.start?.offset;
  const endOffset = nodes.at(-1)?.position?.end?.offset;

  if (typeof startOffset !== "number" || typeof endOffset !== "number") {
    return "";
  }

  return source.slice(startOffset, endOffset).trim();
}

function isEsmNode(node: MdxAstNode): boolean {
  return node.type === "mdxjsEsm";
}

function isPreviewExportNode(node: MdxAstNode): boolean {
  return isEsmNode(node) && /(?:^|\n)\s*export\s+function\s+Preview\s*\(/u.test(node.value ?? "");
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
