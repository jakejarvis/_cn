import { getMdxNodesSource, parseMdxAst, type MdxAstNode } from "../content/mdx.ts";

type RegistryMdxSections = {
  previewSource: string;
  hasUsage: boolean;
  usageSource: string;
};

export function parseRegistryMdxAst(path: string, source: string): MdxAstNode {
  return parseMdxAst({ label: "Registry item", path, source });
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
    usageSource: getMdxNodesSource(usageNodes, source),
  };
}

function getEsmSource(nodes: MdxAstNode[]): string {
  return nodes
    .map((node) => node.value?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n");
}

function isEsmNode(node: MdxAstNode): boolean {
  return node.type === "mdxjsEsm";
}

function isPreviewExportNode(node: MdxAstNode): boolean {
  return isEsmNode(node) && /(?:^|\n)\s*export\s+function\s+Preview\s*\(/u.test(node.value ?? "");
}
