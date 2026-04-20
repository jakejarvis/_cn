import { createFileRoute, notFound } from "@tanstack/react-router";

import { AuthoredDocsPage } from "@/components/docs/authored-docs-page";
import { DocsLayout } from "@/components/docs/docs-layout";
import { getDocsPageDetail } from "@/lib/docs/detail.functions";

export const Route = createFileRoute("/docs/")({
  loader: async () => {
    const data = await getDocsPageDetail({ data: { path: "" } });

    if (!data.page) {
      throw notFound();
    }

    return data;
  },
  component: DocsIndexRoute,
});

function DocsIndexRoute() {
  const { page } = Route.useLoaderData();

  return (
    <DocsLayout section="docs">
      <AuthoredDocsPage page={page} />
    </DocsLayout>
  );
}
