import type { SiteNavigationSectionId } from "../../lib/navigation";
import { Skeleton } from "../ui/skeleton";
import { DocsLayout } from "./docs-layout";

type ContentSkeletonProps = {
  section: SiteNavigationSectionId;
  variant?: "docs" | "registry-item";
};

export function ContentSkeleton({ section, variant = "docs" }: ContentSkeletonProps) {
  return (
    <DocsLayout section={section}>
      <article className="flex min-w-0 flex-col gap-8" aria-busy="true" aria-label="Loading page">
        <header className="flex max-w-3xl flex-col gap-2">
          <div className="flex flex-row flex-wrap items-start justify-between gap-3">
            <Skeleton className="h-9 w-52 max-w-full" />
            <Skeleton className="h-9 w-28" />
          </div>
          <Skeleton className="h-5 w-full max-w-xl" />
        </header>

        {variant === "registry-item" ? <RegistryItemContentSkeleton /> : <DocsContentSkeleton />}
      </article>
    </DocsLayout>
  );
}

function DocsContentSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="mt-4 h-40 w-full rounded-lg" />
    </div>
  );
}

function RegistryItemContentSkeleton() {
  return (
    <>
      <Skeleton className="h-72 w-full rounded-lg" />
      <section className="flex flex-col gap-4">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </section>
    </>
  );
}
