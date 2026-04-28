import { createFileRoute, notFound } from "@tanstack/react-router";

import { RegistryItemDoc, RegistryItemNotFound } from "@/components/docs/component-doc";
import { ContentSkeleton } from "@/components/docs/content-skeleton";
import { DocsLayout } from "@/components/docs/docs-layout";

import { getRegistryItemDetail } from "../lib/registry/detail.functions";
import { getRegistryTypeLabel, registryCatalog } from "../lib/registry/item-types";
import { getMarkdownAlternatePath, getSeoHead, getTechArticleJsonLd } from "../lib/seo";

export const Route = createFileRoute("/registry/$name")({
  loader: async ({ params }) => {
    const detail = await getRegistryItemDetail({
      data: {
        name: params.name,
      },
    });

    if (!detail.item) {
      throw notFound();
    }

    return detail.item;
  },
  pendingComponent: RegistryItemPendingRoute,
  head: ({ loaderData: item }) => {
    if (!item) {
      return getSeoHead({
        title: registryCatalog.title,
        description: registryCatalog.description,
        path: registryCatalog.basePath,
        markdownPath: getMarkdownAlternatePath(registryCatalog.basePath),
      });
    }

    const path = `${registryCatalog.basePath}/${item.name}`;

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
          section: getRegistryTypeLabel(item.type),
        }),
      ],
    });
  },
  component: RegistryItemRoute,
  notFoundComponent: RegistryItemNotFoundRoute,
});

function RegistryItemPendingRoute() {
  return <ContentSkeleton section={registryCatalog.id} variant="registry-item" />;
}

function RegistryItemRoute() {
  const item = Route.useLoaderData();

  return (
    <DocsLayout section={registryCatalog.id}>
      <RegistryItemDoc item={item} />
    </DocsLayout>
  );
}

function RegistryItemNotFoundRoute() {
  return (
    <DocsLayout section={registryCatalog.id}>
      <RegistryItemNotFound />
    </DocsLayout>
  );
}
