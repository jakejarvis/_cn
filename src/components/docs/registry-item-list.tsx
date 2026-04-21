import { Link } from "@tanstack/react-router";

import type { RegistryCatalogItem } from "@/lib/registry/catalog";
import type { RegistrySectionConfig } from "@/lib/registry/sections";

import { DocsPageHeader } from "./docs-page-header";

type RegistryItemListProps = {
  title: string;
  description: string;
  pagePath: string;
  items: RegistryCatalogItem[];
  detailRoute: RegistrySectionConfig["detailRoute"];
};

export function RegistryItemList({
  title,
  description,
  pagePath,
  items,
  detailRoute,
}: RegistryItemListProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <DocsPageHeader title={title} description={description} pagePath={pagePath} />

      {items.length > 0 ? (
        <div className="flex flex-col">
          {items.map((item) => (
            <Link
              key={item.name}
              to={detailRoute}
              params={{ name: item.name }}
              className="flex flex-col gap-1 border-b py-3 transition-colors first:border-t hover:text-foreground"
            >
              <span className="text-sm font-medium">{item.title}</span>
              <span className="text-sm text-muted-foreground">{item.description}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border p-4 text-sm text-muted-foreground">
          Add items under <code>registry/items</code> to publish this section.
        </p>
      )}
    </div>
  );
}
