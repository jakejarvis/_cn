import { createFileRoute } from "@tanstack/react-router";

import { DocsLayout } from "@/components/docs/docs-layout";
import { RegistryItemList } from "@/components/docs/registry-item-list";

import { getRegistryNavigationCatalogWithItems } from "../lib/registry/catalog-navigation";
import { registryCatalog } from "../lib/registry/item-types";
import { getRegistryItemRoutePath } from "../lib/registry/sections";
import { getCollectionPageJsonLd, getMarkdownAlternatePath, getSeoHead } from "../lib/seo";

export const Route = createFileRoute("/registry/")({
  head: () => {
    const catalog = getRegistryNavigationCatalogWithItems();

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
            path: getRegistryItemRoutePath(item),
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
      <RegistryItemList catalog={getRegistryNavigationCatalogWithItems()} />
    </DocsLayout>
  );
}
