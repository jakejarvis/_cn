import {
  assertNoMdxEsm,
  getFirstHeadingText,
  getFrontmatterSource,
  getMdxBodySource,
  getOptionalNumberField,
  getOptionalStringField,
  getUnsupportedMdxComponentNames,
  parseMdxAst,
  parseYamlFrontmatterObject,
  type MdxAstNode,
} from "../content/mdx.ts";
import type { DocsPageMetadata } from "./catalog-metadata.ts";
import { docsMdxComponentNames, docsMdxComponentNameSet } from "./mdx-components.ts";

export { getSortedDocsPages } from "./catalog-metadata.ts";
export type { DocsPageMetadata } from "./catalog-metadata.ts";

type DocsFrontmatter = {
  title?: string;
  description?: string;
  order?: number;
  group?: string;
};

export type DocsPage = DocsPageMetadata & {
  contentSource: string;
  keywords: string;
};

export function getDocsRoutePathFromSourcePath(sourcePath: string): string | null {
  const slug = getDocsSlugFromSourcePath(sourcePath);

  if (slug === null) {
    return null;
  }

  return slug ? `/docs/${slug}` : "/docs";
}

export function parseDocsPageSource(sourcePath: string, source: string): DocsPage | null {
  const parsed = parseDocsPageMetadata(sourcePath, source);

  if (!parsed) {
    return null;
  }

  const { metadata, root } = parsed;
  const contentSource = getContentSource(root, source);

  return {
    ...metadata,
    contentSource,
    keywords: getDocsKeywords({ ...metadata, contentSource }),
  };
}

export function parseDocsPageMetadataSource(
  sourcePath: string,
  source: string,
): DocsPageMetadata | null {
  return parseDocsPageMetadata(sourcePath, source)?.metadata ?? null;
}

function parseDocsPageMetadata(
  sourcePath: string,
  source: string,
): { metadata: DocsPageMetadata; root: MdxAstNode } | null {
  const slug = getDocsSlugFromSourcePath(sourcePath);

  if (slug === null) {
    return null;
  }

  const root = parseDocsMdxAst(sourcePath, source);
  assertCuratedDocsMdx(sourcePath, root);

  const frontmatter = parseDocsFrontmatter(sourcePath, getFrontmatterSource(root));
  const title = frontmatter.title ?? getFirstHeadingText(root) ?? getFallbackTitle(sourcePath);
  const description = frontmatter.description ?? "";
  const group = frontmatter.group ?? getFallbackGroup(slug);

  return {
    root,
    metadata: {
      sourcePath,
      slug,
      routePath: slug ? `/docs/${slug}` : "/docs",
      title,
      description,
      order: frontmatter.order ?? 0,
      ...(group ? { group } : {}),
    },
  };
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
  const value = parseYamlFrontmatterObject({ ...diagnostic, source: frontmatter });

  return {
    title: getOptionalStringField(diagnostic, value, "title"),
    description: getOptionalStringField(diagnostic, value, "description"),
    order: getOptionalNumberField(diagnostic, value, "order"),
    group: getOptionalStringField(diagnostic, value, "group"),
  };
}

function assertCuratedDocsMdx(path: string, root: MdxAstNode): void {
  assertNoMdxEsm(
    root,
    `Docs page ${path} must not contain MDX imports or exports. Use the built-in docs components instead.`,
  );

  const unsupportedComponents = getUnsupportedMdxComponentNames(root, docsMdxComponentNameSet);

  if (unsupportedComponents.length > 0) {
    throw new Error(
      `Docs page ${path} uses unsupported MDX component(s): ${unsupportedComponents.join(
        ", ",
      )}. Available docs components: ${docsMdxComponentNames.join(", ")}.`,
    );
  }
}

function getContentSource(root: MdxAstNode, source: string): string {
  return getMdxBodySource(root, source);
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

function titleizePathSegment(value: string): string {
  return value
    .split(/[-_\s]+/u)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
