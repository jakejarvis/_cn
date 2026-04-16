import { createFileRoute } from "@tanstack/react-router";

import { RegistryItemDoc, RegistryItemNotFound } from "@/components/docs/component-doc";
import { DocsLayout } from "@/components/docs/docs-layout";
import { getRegistryItemDetail } from "@/lib/registry/detail.functions";
import { registrySections } from "@/lib/registry/sections";

const section = registrySections.components;

export const Route = createFileRoute("/components/$name")({
  loader: ({ params }) =>
    getRegistryItemDetail({
      data: {
        name: params.name,
        expectedTypes: [...section.registryTypes],
      },
    }),
  component: ComponentRoute,
});

function ComponentRoute() {
  const { item } = Route.useLoaderData();

  return (
    <DocsLayout section={section.id}>
      {!item ? (
        <RegistryItemNotFound sectionPath={section.basePath} />
      ) : (
        <RegistryItemDoc item={item} section={section.title} sectionPath={section.basePath} />
      )}
    </DocsLayout>
  );
}
