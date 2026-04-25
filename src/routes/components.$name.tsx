import { createFileRoute, notFound } from "@tanstack/react-router";

import { RegistryItemDoc, RegistryItemNotFound } from "@/components/docs/component-doc";
import { ContentSkeleton } from "@/components/docs/content-skeleton";
import { DocsLayout } from "@/components/docs/docs-layout";

import { getRegistryItemDetail } from "../lib/registry/detail.functions";
import { registrySections } from "../lib/registry/sections";
import { getMarkdownAlternatePath, getSeoHead, getTechArticleJsonLd } from "../lib/seo";

const section = registrySections.components;

export const Route = createFileRoute("/components/$name")({
  loader: async ({ params }) => {
    const detail = await getRegistryItemDetail({
      data: {
        name: params.name,
        expectedTypes: [...section.registryTypes],
      },
    });

    if (!detail.item) {
      throw notFound();
    }

    return detail.item;
  },
  pendingComponent: ComponentPendingRoute,
  head: ({ loaderData: item }) => {
    if (!item) {
      return getSeoHead({
        title: section.title,
        description: section.description,
        path: section.basePath,
        markdownPath: getMarkdownAlternatePath(section.basePath),
      });
    }

    const path = `${section.basePath}/${item.name}`;

    return getSeoHead({
      title: item.title,
      description: item.description,
      path,
      markdownPath: getMarkdownAlternatePath(path),
      ogType: "article",
      jsonLd: [
        getTechArticleJsonLd({
          title: item.title,
          description: item.description,
          path,
          section: section.title,
        }),
      ],
    });
  },
  component: ComponentRoute,
  notFoundComponent: ComponentNotFoundRoute,
});

function ComponentPendingRoute() {
  return <ContentSkeleton section={section.id} variant="registry-item" />;
}

function ComponentRoute() {
  const item = Route.useLoaderData();

  return (
    <DocsLayout section={section.id}>
      <RegistryItemDoc item={item} section={section.title} sectionPath={section.basePath} />
    </DocsLayout>
  );
}

function ComponentNotFoundRoute() {
  return (
    <DocsLayout section={section.id}>
      <RegistryItemNotFound sectionPath={section.basePath} />
    </DocsLayout>
  );
}
