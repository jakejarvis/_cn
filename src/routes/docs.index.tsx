import { createFileRoute, notFound } from "@tanstack/react-router";

import { AuthoredDocsPage } from "@/components/docs/authored-docs-page";
import { DocsLayout } from "@/components/docs/docs-layout";
import { getDocsPageDetail } from "@/lib/docs/detail.functions";
import { getMarkdownAlternatePath, getSeoHead, getTechArticleJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/docs/")({
  loader: async () => {
    const data = await getDocsPageDetail({ data: { path: "" } });

    if (!data.page) {
      throw notFound();
    }

    return data;
  },
  head: ({ loaderData }) => {
    const page = loaderData?.page;

    if (!page) {
      return getSeoHead({
        title: "Docs",
        description: siteConfig.description,
        path: "/docs",
        markdownPath: getMarkdownAlternatePath("/docs"),
      });
    }

    return getSeoHead({
      title: page.title,
      description: page.description,
      path: page.routePath,
      markdownPath: getMarkdownAlternatePath(page.routePath),
      ogType: "article",
      jsonLd: [
        getTechArticleJsonLd({
          title: page.title,
          description: page.description,
          path: page.routePath,
          section: "Docs",
        }),
      ],
    });
  },
  component: DocsIndexRoute,
});

function DocsIndexRoute() {
  const data = Route.useLoaderData();

  if (!data?.page) {
    throw notFound();
  }

  const { page } = data;

  return (
    <DocsLayout section="docs">
      <AuthoredDocsPage page={page} />
    </DocsLayout>
  );
}
