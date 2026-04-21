import { createFileRoute, notFound } from "@tanstack/react-router";

import { RegistryItemDoc, RegistryItemNotFound } from "@/components/docs/component-doc";
import { DocsLayout } from "@/components/docs/docs-layout";
import { getRegistryItemDetail } from "@/lib/registry/detail.functions";
import { registrySections } from "@/lib/registry/sections";

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
