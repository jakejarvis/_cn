import { createFileRoute, notFound } from "@tanstack/react-router";

import { RegistryItemDoc } from "@/components/docs/component-doc";
import { ContentSkeleton } from "@/components/docs/content-skeleton";
import { DocsLayout } from "@/components/docs/docs-layout";

import { registryItems } from "../lib/registry/catalog";
import { getRegistryItemDetail } from "../lib/registry/detail.functions";
import {
  getRegistryItemRoutePath,
  getRegistrySectionForType,
  getRegistrySectionItem,
  isRegistrySectionId,
} from "../lib/registry/sections";
import { getMarkdownAlternatePath, getSeoHead, getTechArticleJsonLd } from "../lib/seo";

export const Route = createFileRoute("/$section/$name")({
  loader: async ({ params }) => {
    const sectionItem = getRegistrySectionItem(params.section, params.name, registryItems);

    if (!sectionItem) {
      throw notFound();
    }

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
  pendingComponent: RegistrySectionItemPendingRoute,
  head: ({ loaderData: item }) => {
    if (!item) {
      return getSeoHead({
        title: "Registry",
        description: "Installable shadcn-compatible registry items.",
        path: "/components",
      });
    }

    const section = getRegistrySectionForType(item.type);
    const path = getRegistryItemRoutePath(item);

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
  component: RegistrySectionItemRoute,
});

function RegistrySectionItemPendingRoute() {
  const { section } = Route.useParams();

  return (
    <ContentSkeleton
      section={isRegistrySectionId(section) ? section : "components"}
      variant="registry-item"
    />
  );
}

function RegistrySectionItemRoute() {
  const item = Route.useLoaderData();
  const section = getRegistrySectionForType(item.type);

  return (
    <DocsLayout section={section.id}>
      <RegistryItemDoc item={item} />
    </DocsLayout>
  );
}
