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

export function getMdxEsmSource(root: MdxAstNode): string {
  return (
    root.children
      ?.filter((node) => node.type === "mdxjsEsm")
      .map((node) => node.value?.trim() ?? "")
      .filter(Boolean)
      .join("\n\n") ?? ""
  );
}

export function hasMdxUsageContent(root: MdxAstNode): boolean {
  return getMdxUsageNodes(root).length > 0;
}

export function getMdxUsageSource(root: MdxAstNode, source: string): string {
  const usageNodes = getMdxUsageNodes(root);
  const startOffset = usageNodes[0]?.position?.start?.offset;
  const endOffset = usageNodes.at(-1)?.position?.end?.offset;

  if (typeof startOffset !== "number" || typeof endOffset !== "number") {
    return "";
  }

  return source.slice(startOffset, endOffset).trim();
}

function getMdxUsageNodes(root: MdxAstNode): MdxAstNode[] {
  return root.children?.filter((node) => node.type !== "yaml" && node.type !== "mdxjsEsm") ?? [];
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
