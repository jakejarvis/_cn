import { createFileRoute } from "@tanstack/react-router";

import { DocsLayout } from "@/components/docs/docs-layout";
import { RegistryItemList } from "@/components/docs/registry-item-grid";
import { getRegistrySectionItems, registrySections } from "@/lib/registry/sections";

export const Route = createFileRoute("/utilities/")({ component: UtilitiesIndex });

function UtilitiesIndex() {
  const section = registrySections.utilities;

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
