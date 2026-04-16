import { Link } from "@tanstack/react-router";

import type { RegistryCatalogItem } from "@/lib/registry/catalog";
import type { RegistrySectionConfig } from "@/lib/registry/sections";
import { cn } from "@/lib/utils";

type DocsSidebarProps = {
  title: string;
  items: RegistryCatalogItem[];
  basePath: RegistrySectionConfig["basePath"];
  pathname: string;
  onNavigate?: () => void;
};

export function DocsSidebar({ title, items, basePath, pathname, onNavigate }: DocsSidebarProps) {
  return (
    <nav className="flex flex-col gap-1">
      <h4 className="px-3 py-1 text-sm font-semibold">{title}</h4>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const href = `${basePath}/${item.name}`;
          const isActive = pathname === href;

          return (
            <li key={item.name}>
              <Link
                to={`${basePath}/$name`}
                params={{ name: item.name }}
                onClick={onNavigate}
                className={cn(
                  "block rounded-md px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
