import { createFileRoute, notFound } from "@tanstack/react-router";

import { DocsLayout } from "@/components/docs/docs-layout";
import { RegistryItemList } from "@/components/docs/registry-item-list";

import { registryItems } from "../lib/registry/catalog";
import { getRegistryItemRoutePath, getRegistrySectionWithItems } from "../lib/registry/sections";
import { getCollectionPageJsonLd, getMarkdownAlternatePath, getSeoHead } from "../lib/seo";

export const Route = createFileRoute("/$section/")({
  loader: ({ params }) => {
    const section = getRegistrySectionWithItems(params.section, registryItems);

    if (!section) {
      throw notFound();
    }

    return section;
  },
  head: ({ loaderData: section }) => {
    if (!section) {
      return getSeoHead({
        title: "Registry",
        description: "Installable shadcn-compatible registry items.",
        path: "/components",
      });
    }

    return getSeoHead({
      title: section.title,
      description: section.description,
      path: section.basePath,
      markdownPath: getMarkdownAlternatePath(section.basePath),
      jsonLd: [
        getCollectionPageJsonLd({
          title: section.title,
          description: section.description,
          path: section.basePath,
          items: section.items.map((item) => ({
            title: item.title,
            description: item.description,
            path: getRegistryItemRoutePath(item),
          })),
        }),
      ],
    });
  },
  component: RegistrySectionRoute,
});

function RegistrySectionRoute() {
  const section = Route.useLoaderData();

  return (
    <DocsLayout section={section.id}>
      <RegistryItemList catalog={section} />
    </DocsLayout>
  );
}
