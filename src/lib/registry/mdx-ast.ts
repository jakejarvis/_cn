import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";

export type MdxAstNode = {
  type: string;
  value?: string;
  children?: MdxAstNode[];
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
  return root.children?.some((node) => node.type !== "yaml" && node.type !== "mdxjsEsm") ?? false;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
