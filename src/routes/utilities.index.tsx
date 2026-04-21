import { createFileRoute } from "@tanstack/react-router";

import { DocsLayout } from "@/components/docs/docs-layout";
import { RegistryItemList } from "@/components/docs/registry-item-list";
import { getRegistrySectionItems } from "@/lib/registry/section-items";
import { registrySections } from "@/lib/registry/sections";
import { getCollectionPageJsonLd, getMarkdownAlternatePath, getSeoHead } from "@/lib/seo";

const section = registrySections.utilities;

export const Route = createFileRoute("/utilities/")({
  head: () => {
    const items = getRegistrySectionItems(section.id);

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
          items: items.map((item) => ({
            title: item.title,
            description: item.description,
            path: `${section.basePath}/${item.name}`,
          })),
        }),
      ],
    });
  },
  component: UtilitiesIndex,
});

function UtilitiesIndex() {
  return (
    <DocsLayout section={section.id}>
      <RegistryItemList
        title={section.title}
        description={section.description}
        pagePath={section.basePath}
        items={getRegistrySectionItems(section.id)}
        detailRoute={section.detailRoute}
      />
    </DocsLayout>
  );
}
