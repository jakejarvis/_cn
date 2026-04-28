import { createFileRoute } from "@tanstack/react-router";

import { DocsLayout } from "@/components/docs/docs-layout";
import { RegistryItemList } from "@/components/docs/registry-item-list";

import { getRegistryCatalogWithItems } from "../lib/registry/catalog";
import { registryCatalog } from "../lib/registry/item-types";
import { getCollectionPageJsonLd, getMarkdownAlternatePath, getSeoHead } from "../lib/seo";

export const Route = createFileRoute("/registry/")({
  head: () => {
    const catalog = getRegistryCatalogWithItems();

    return getSeoHead({
      title: catalog.title,
      description: catalog.description,
      path: catalog.basePath,
      markdownPath: getMarkdownAlternatePath(catalog.basePath),
      jsonLd: [
        getCollectionPageJsonLd({
          title: catalog.title,
          description: catalog.description,
          path: catalog.basePath,
          items: catalog.items.map((item) => ({
            title: item.title,
            description: item.description,
            path: `${catalog.basePath}/${item.name}`,
          })),
        }),
      ],
    });
  },
  component: RegistryIndex,
});

function RegistryIndex() {
  return (
    <DocsLayout section={registryCatalog.id}>
      <RegistryItemList catalog={getRegistryCatalogWithItems()} />
    </DocsLayout>
  );
}
