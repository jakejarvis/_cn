import { createFileRoute, notFound } from "@tanstack/react-router";

import { RegistryItemDoc, RegistryItemNotFound } from "@/components/docs/component-doc";
import { DocsLayout } from "@/components/docs/docs-layout";
import { getRegistryItemDetail } from "@/lib/registry/detail.functions";
import { registrySections } from "@/lib/registry/sections";

const section = registrySections.components;

export const Route = createFileRoute("/components/$name")({
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
  component: ComponentRoute,
  notFoundComponent: ComponentNotFoundRoute,
});

function ComponentRoute() {
  const item = Route.useLoaderData();

  return (
    <DocsLayout section={section.id}>
      <RegistryItemDoc item={item} section={section.title} sectionPath={section.basePath} />
    </DocsLayout>
  );
}

function ComponentNotFoundRoute() {
  return (
    <DocsLayout section={section.id}>
      <RegistryItemNotFound sectionPath={section.basePath} />
    </DocsLayout>
  );
}
