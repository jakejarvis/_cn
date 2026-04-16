import { Link } from "@tanstack/react-router";

import type { RegistryCatalogItem } from "@/lib/registry/catalog";
import type { RegistrySectionConfig } from "@/lib/registry/sections";

type RegistryItemListProps = {
  title: string;
  description: string;
  items: RegistryCatalogItem[];
  detailRoute: RegistrySectionConfig["detailRoute"];
};

export function RegistryItemList({
  title,
  description,
  items,
  detailRoute,
}: RegistryItemListProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </header>

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
