import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { parse as parseYaml } from "yaml";

import { normalizeGlobFiles } from "@/lib/glob";

type MdxAstNode = {
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

type DocsFrontmatter = {
  title?: string;
  description?: string;
  order?: number;
  group?: string;
};

export type DocsPage = {
  sourcePath: string;
  slug: string;
  routePath: string;
  title: string;
  description: string;
  order: number;
  group?: string;
  contentSource: string;
  keywords: string;
};

export type DocsNavigationItem = Pick<
  DocsPage,
  "title" | "description" | "slug" | "routePath" | "group"
>;

export type DocsNavigationSection = {
  id: "docs";
  title: "Docs";
  basePath: "/docs";
  items: DocsNavigationItem[];
};

const docsSources = import.meta.glob<string>("../../../registry/docs/**/*.{md,mdx}", {
  eager: true,
  import: "default",
  query: "?raw",
});

const docsMdxProcessor = unified()
  .use(remarkParse)
  .use(remarkMdx)
  .use(remarkFrontmatter, ["yaml"])
  .use(remarkGfm);

const docsCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});
const allowedDocsMdxComponents = new Set(["Callout"]);

export const docsPages = getSortedDocsPages(
  Object.entries(normalizeGlobFiles(docsSources)).flatMap(([sourcePath, source]) => {
    const page = parseDocsPageSource(sourcePath, source);

    return page ? [page] : [];
  }),
);

const docsPagesBySlug = new Map(docsPages.map((page) => [page.slug, page]));

export function getDocsPage(path: string): DocsPage | undefined {
  return docsPagesBySlug.get(normalizeDocsPath(path));
}

export function getDocsNavigationSection(): DocsNavigationSection | null {
  if (docsPages.length === 0) {
    return null;
  }

  return {
    id: "docs",
    title: "Docs",
    basePath: "/docs",
    items: docsPages.map(toDocsNavigationItem),
  };
}

export function getDocsRoutePathFromSourcePath(sourcePath: string): string | null {
  const slug = getDocsSlugFromSourcePath(sourcePath);

  if (slug === null) {
    return null;
  }

  return slug ? `/docs/${slug}` : "/docs";
}

export function parseDocsPageSource(sourcePath: string, source: string): DocsPage | null {
  const slug = getDocsSlugFromSourcePath(sourcePath);

  if (slug === null) {
    return null;
  }

  const root = parseDocsMdxAst(sourcePath, source);
  assertCuratedDocsMdx(sourcePath, root);

  const frontmatter = parseDocsFrontmatter(sourcePath, getFrontmatterSource(root));
  const contentSource = getContentSource(root, source);
  const title = frontmatter.title ?? getFirstHeadingText(root) ?? getFallbackTitle(sourcePath);
  const description = frontmatter.description ?? "";
  const group = frontmatter.group ?? getFallbackGroup(slug);

  return {
    sourcePath,
    slug,
    routePath: slug ? `/docs/${slug}` : "/docs",
    title,
    description,
    order: frontmatter.order ?? 0,
    ...(group ? { group } : {}),
    contentSource,
    keywords: getDocsKeywords({ sourcePath, slug, title, description, group, contentSource }),
  };
}

export function getSortedDocsPages(pages: DocsPage[]): DocsPage[] {
  assertUniqueDocsRoutes(pages);

  return pages.toSorted(compareDocsPages);
}

export function normalizeDocsPath(path: string): string {
  return path
    .replace(/\\/gu, "/")
    .replace(/\.mdx?$/u, "")
    .replace(/^\/+|\/+$/gu, "")
    .replace(/^docs\/?/u, "")
    .replace(/^\/+|\/+$/gu, "");
}

function getDocsSlugFromSourcePath(sourcePath: string): string | null {
  const normalizedPath = sourcePath.replace(/\\/gu, "/");
  const docsPath = normalizedPath.replace(/^registry\/docs\//u, "");

  if (docsPath === normalizedPath || !/\.(?:md|mdx)$/u.test(docsPath)) {
    throw new Error(
      `Docs page source must be under registry/docs and end with .md or .mdx: ${sourcePath}`,
    );
  }

  const segments = docsPath.replace(/\.(?:md|mdx)$/u, "").split("/");

  if (segments.some((segment) => !segment || segment.startsWith("_"))) {
    return null;
  }

  if (segments.length > 1) {
    throw new Error(
      `Nested docs pages are not supported yet. Move ${sourcePath} directly under registry/docs.`,
    );
  }

  if (segments.at(-1) === "index") {
    segments.pop();
  }

  return segments.join("/");
}

function parseDocsMdxAst(path: string, source: string): MdxAstNode {
  try {
    const root = docsMdxProcessor.parse(source);

    if (!isMdxAstNode(root)) {
      throw new Error("Parsed MDX did not produce a valid document tree.");
    }

    return root;
  } catch (error) {
    throw new Error(`Docs page ${path} contains invalid MDX: ${getErrorMessage(error)}`, {
      cause: error,
    });
  }
}

function isMdxAstNode(value: unknown): value is MdxAstNode {
  return isRecord(value) && typeof value.type === "string";
}

function getFrontmatterSource(root: MdxAstNode): string {
  const frontmatter = root.children?.[0];

  return frontmatter?.type === "yaml" ? (frontmatter.value ?? "") : "";
}

function parseDocsFrontmatter(path: string, frontmatter: string): DocsFrontmatter {
  if (!frontmatter.trim()) {
    return {};
  }

  const value = parseYamlFrontmatter(path, frontmatter);

  if (!isRecord(value)) {
    throw new Error(`Docs page ${path} frontmatter must be an object.`);
  }

  return {
    title: getOptionalStringField(path, value, "title"),
    description: getOptionalStringField(path, value, "description"),
    order: getOptionalNumberField(path, value, "order"),
    group: getOptionalStringField(path, value, "group"),
  };
}

function parseYamlFrontmatter(path: string, frontmatter: string): unknown {
  try {
    return parseYaml(frontmatter);
  } catch (error) {
    throw new Error(
      `Docs page ${path} contains invalid YAML frontmatter: ${getErrorMessage(error)}`,
      {
        cause: error,
      },
    );
  }
}

function getOptionalStringField(
  path: string,
  value: Record<string, unknown>,
  field: keyof DocsFrontmatter,
): string | undefined {
  const fieldValue = value[field];

  if (fieldValue === undefined) {
    return undefined;
  }

  if (typeof fieldValue === "string") {
    return fieldValue;
  }

  throw new Error(`Docs page ${path} frontmatter field "${field}" must be a string.`);
}

function getOptionalNumberField(
  path: string,
  value: Record<string, unknown>,
  field: keyof DocsFrontmatter,
): number | undefined {
  const fieldValue = value[field];

  if (fieldValue === undefined) {
    return undefined;
  }

  if (typeof fieldValue === "number" && Number.isFinite(fieldValue)) {
    return fieldValue;
  }

  throw new Error(`Docs page ${path} frontmatter field "${field}" must be a number.`);
}

function assertCuratedDocsMdx(path: string, root: MdxAstNode): void {
  const hasEsm = root.children?.some((node) => node.type === "mdxjsEsm") ?? false;

  if (hasEsm) {
    throw new Error(
      `Docs page ${path} must not contain MDX imports or exports. Use the built-in docs components instead.`,
    );
  }

  const unsupportedComponents = getUnsupportedMdxComponentNames(root);

  if (unsupportedComponents.length > 0) {
    throw new Error(
      `Docs page ${path} uses unsupported MDX component(s): ${unsupportedComponents.join(
        ", ",
      )}. Available docs components: Callout.`,
    );
  }
}

function getUnsupportedMdxComponentNames(root: MdxAstNode): string[] {
  const names = new Set<string>();
  const visit = (node: MdxAstNode) => {
    if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") {
      const name = node.name ?? "<>";

      if (!allowedDocsMdxComponents.has(name)) {
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

function getContentSource(root: MdxAstNode, source: string): string {
  const contentNodes = root.children?.filter((node) => node.type !== "yaml") ?? [];
  const startOffset = contentNodes[0]?.position?.start?.offset;
  const endOffset = contentNodes.at(-1)?.position?.end?.offset;

  if (typeof startOffset !== "number" || typeof endOffset !== "number") {
    return "";
  }

  return source.slice(startOffset, endOffset).trim();
}

function getFirstHeadingText(root: MdxAstNode): string | undefined {
  const heading = root.children?.find((node) => node.type === "heading" && node.depth === 1);
  const text = heading ? getNodeText(heading).trim() : "";

  return text || undefined;
}

function getNodeText(node: MdxAstNode): string {
  if (node.value) {
    return node.value;
  }

  return node.children?.map(getNodeText).join("") ?? "";
}

function getFallbackTitle(sourcePath: string): string {
  const routePath = getDocsRoutePathFromSourcePath(sourcePath);
  const fallbackSegment = routePath
    ? getLastPathSegment(routePath.replace(/^\/docs\/?/u, ""))
    : undefined;

  return titleizePathSegment(fallbackSegment ?? "docs");
}

function getFallbackGroup(slug: string): string | undefined {
  const firstSegment = getFirstPathSegment(slug);

  if (!firstSegment || firstSegment === slug) {
    return undefined;
  }

  return titleizePathSegment(firstSegment);
}

function toDocsNavigationItem(page: DocsPage): DocsNavigationItem {
  const item: DocsNavigationItem = {
    title: page.title,
    description: page.description,
    slug: page.slug,
    routePath: page.routePath,
  };

  return page.group ? Object.assign(item, { group: page.group }) : item;
}

function getFirstPathSegment(path: string): string | undefined {
  return path.split("/").find(Boolean);
}

function getLastPathSegment(path: string): string | undefined {
  const segments = path.split("/");

  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const segment = segments[index];

    if (segment) {
      return segment;
    }
  }

  return undefined;
}

function getDocsKeywords({
  sourcePath,
  slug,
  title,
  description,
  group,
  contentSource,
}: {
  sourcePath: string;
  slug: string;
  title: string;
  description: string;
  group?: string;
  contentSource: string;
}): string {
  return ["docs", sourcePath, slug.replaceAll("/", " "), title, description, group, contentSource]
    .filter(Boolean)
    .join(" ");
}

function compareDocsPages(a: DocsPage, b: DocsPage): number {
  if (a.slug === "" && b.slug !== "") {
    return -1;
  }

  if (a.slug !== "" && b.slug === "") {
    return 1;
  }

  return (
    a.order - b.order ||
    docsCollator.compare(a.group ?? "", b.group ?? "") ||
    docsCollator.compare(a.title, b.title) ||
    docsCollator.compare(a.slug, b.slug)
  );
}

function assertUniqueDocsRoutes(pages: DocsPage[]): void {
  const routes = new Map<string, string>();

  for (const page of pages) {
    const existingSourcePath = routes.get(page.routePath);

    if (existingSourcePath) {
      throw new Error(
        `Docs pages ${existingSourcePath} and ${page.sourcePath} map to the same route: ${page.routePath}`,
      );
    }

    routes.set(page.routePath, page.sourcePath);
  }
}

function titleizePathSegment(value: string): string {
  return value
    .split(/[-_\s]+/u)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
