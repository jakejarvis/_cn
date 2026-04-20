import { createFileRoute, notFound } from "@tanstack/react-router";

import { RegistryItemDoc, RegistryItemNotFound } from "@/components/docs/component-doc";
import { DocsLayout } from "@/components/docs/docs-layout";
import { getRegistryItemDetail } from "@/lib/registry/detail.functions";
import { registrySections } from "@/lib/registry/sections";

const section = registrySections.utilities;

export const Route = createFileRoute("/utilities/$name")({
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
  component: UtilityRoute,
  notFoundComponent: UtilityNotFoundRoute,
});

function UtilityRoute() {
  const item = Route.useLoaderData();

  return (
    <DocsLayout section={section.id}>
      <RegistryItemDoc item={item} section={section.title} sectionPath={section.basePath} />
    </DocsLayout>
  );
}

function UtilityNotFoundRoute() {
  return (
    <DocsLayout section={section.id}>
      <RegistryItemNotFound sectionPath={section.basePath} />
    </DocsLayout>
  );
}
