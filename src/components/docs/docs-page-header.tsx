import { getCanonicalDocsUrl, getDocsMarkdownPath } from "../../lib/site-config";
import { cn } from "../../lib/utils";
import { DocsPageActions } from "./docs-page-actions";

type DocsPageHeaderProps = {
  title: string;
  description: string;
  pagePath: string;
  className?: string;
};

export function DocsPageHeader({ title, description, pagePath, className }: DocsPageHeaderProps) {
  return (
    <header className={cn("flex max-w-3xl flex-col gap-2", className)}>
      <div className="flex flex-row flex-wrap items-start justify-between gap-3">
        <h1 className="min-w-0 font-heading text-3xl font-semibold tracking-tight">{title}</h1>
        <DocsPageActions
          markdownPath={getDocsMarkdownPath(pagePath)}
          pageUrl={getCanonicalDocsUrl(pagePath)}
          className="shrink-0"
        />
      </div>
      <p className="text-base text-muted-foreground">{description}</p>
    </header>
  );
}
