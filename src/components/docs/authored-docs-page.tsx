import type { DocsPageDetail } from "@/lib/docs/detail.functions";

import { DocsPageHeader } from "./docs-page-header";

type AuthoredDocsPageProps = {
  page: DocsPageDetail;
};

export function AuthoredDocsPage({ page }: AuthoredDocsPageProps) {
  return (
    <article className="flex min-w-0 flex-col gap-8">
      <DocsPageHeader title={page.title} description={page.description} pagePath={page.routePath} />
      {page.content}
    </article>
  );
}
