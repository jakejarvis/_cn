export type DocsPageMetadata = {
  sourcePath: string;
  slug: string;
  routePath: string;
  title: string;
  description: string;
  order: number;
  group?: string;
};

export function getSortedDocsPages<T extends DocsPageMetadata>(pages: readonly T[]): T[] {
  const sortedPages = [...pages];

  assertUniqueDocsRoutes(sortedPages);

  return sortedPages.toSorted(compareDocsPages);
}

function compareDocsPages<T extends DocsPageMetadata>(a: T, b: T): number {
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

function assertUniqueDocsRoutes(pages: readonly DocsPageMetadata[]): void {
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

const docsCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});
