import {
  getFrontmatterSource,
  getMdxNodesSource,
  getOptionalNumberField,
  getOptionalStringField,
  parseMdxAst,
  parseYamlFrontmatter,
  type MdxAstNode,
} from "../content/mdx";
import { normalizeGlobFiles } from "../glob";

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

function normalizeDocsPath(path: string): string {
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
  return parseMdxAst({ label: "Docs page", path, source });
}

function parseDocsFrontmatter(path: string, frontmatter: string): DocsFrontmatter {
  if (!frontmatter.trim()) {
    return {};
  }

  const diagnostic = { label: "Docs page", path };
  const value = parseYamlFrontmatter({ ...diagnostic, source: frontmatter });

  if (!isRecord(value)) {
    throw new Error(`Docs page ${path} frontmatter must be an object.`);
  }

  return {
    title: getOptionalStringField(diagnostic, value, "title"),
    description: getOptionalStringField(diagnostic, value, "description"),
    order: getOptionalNumberField(diagnostic, value, "order"),
    group: getOptionalStringField(diagnostic, value, "group"),
  };
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
  return getMdxNodesSource(contentNodes, source);
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
  return {
    title: page.title,
    description: page.description,
    slug: page.slug,
    routePath: page.routePath,
    ...(page.group ? { group: page.group } : {}),
  };
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
