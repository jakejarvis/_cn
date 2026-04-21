import { createFileRoute, notFound } from "@tanstack/react-router";

import { RegistryItemDoc, RegistryItemNotFound } from "@/components/docs/component-doc";
import { DocsLayout } from "@/components/docs/docs-layout";
import { getRegistryItemDetail } from "@/lib/registry/detail.functions";
import { registrySections } from "@/lib/registry/section-config";
import { getMarkdownAlternatePath, getSeoHead, getTechArticleJsonLd } from "@/lib/seo";

const section = registrySections.blocks;

export const Route = createFileRoute("/blocks/$name")({
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
  component: BlockRoute,
  notFoundComponent: BlockNotFoundRoute,
});

function BlockRoute() {
  const item = Route.useLoaderData();

  return (
    <DocsLayout section={section.id}>
      <RegistryItemDoc item={item} section={section.title} sectionPath={section.basePath} />
    </DocsLayout>
  );
}

function BlockNotFoundRoute() {
  return (
    <DocsLayout section={section.id}>
      <RegistryItemNotFound sectionPath={section.basePath} />
    </DocsLayout>
  );
}
