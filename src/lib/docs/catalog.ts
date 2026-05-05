import { allAuthoredDocs } from "content-collections";

import {
  getDocsRoutePathFromSourcePath,
  getSortedDocsPages,
  parseDocsPageSource,
  type DocsPage,
} from "./catalog-core";

export type { DocsPage } from "./catalog-core";

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

export { getDocsRoutePathFromSourcePath, getSortedDocsPages, parseDocsPageSource };

export const docsPages = getSortedDocsPages(allAuthoredDocs);

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

function normalizeDocsPath(path: string): string {
  return path
    .replace(/\\/gu, "/")
    .replace(/\.mdx?$/u, "")
    .replace(/^\/+|\/+$/gu, "")
    .replace(/^docs\/?/u, "")
    .replace(/^\/+|\/+$/gu, "");
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
