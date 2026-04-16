import { createFileRoute } from "@tanstack/react-router";

import { DocsLayout } from "@/components/docs/docs-layout";
import { RegistryItemList } from "@/components/docs/registry-item-grid";
import { getRegistrySectionItems, registrySections } from "@/lib/registry/sections";

export const Route = createFileRoute("/components/")({ component: ComponentsIndex });

function ComponentsIndex() {
  const section = registrySections.components;

  return (
    <DocsLayout section={section.id}>
      <RegistryItemList
        title={section.title}
        description={section.description}
        items={getRegistrySectionItems(section.id)}
        detailRoute={section.detailRoute}
      />
    </DocsLayout>
  );
}
