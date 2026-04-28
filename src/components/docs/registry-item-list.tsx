import { Link } from "@tanstack/react-router";

import type { RegistryCatalogWithItems } from "../../lib/registry/catalog";
import { DocsPageHeader } from "./docs-page-header";

type RegistryItemListProps = {
  catalog: RegistryCatalogWithItems;
};

export function RegistryItemList({ catalog }: RegistryItemListProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <DocsPageHeader
        title={catalog.title}
        description={catalog.description}
        pagePath={catalog.basePath}
      />

      {catalog.items.length > 0 ? (
        <div className="flex flex-col gap-8">
          {catalog.groups.map((group) => (
            <section key={group.type} className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-heading text-lg font-semibold tracking-tight">{group.title}</h2>
                <span className="text-xs font-medium text-muted-foreground">
                  {group.items.length}
                </span>
              </div>
              <div className="flex flex-col">
                {group.items.map((item) => (
                  <Link
                    key={item.name}
                    to="/registry/$name"
                    params={{ name: item.name }}
                    className="flex flex-col gap-1 border-b py-3 transition-colors first:border-t hover:text-foreground"
                  >
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="text-sm text-muted-foreground">{item.description}</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border p-4 text-sm text-muted-foreground">
          Add items under <code>registry/items</code> to publish the registry.
        </p>
      )}
    </div>
  );
}
