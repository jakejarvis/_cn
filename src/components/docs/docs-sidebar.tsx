import { Link } from "@tanstack/react-router";

import type { RegistrySectionWithItems } from "@/lib/registry/sections";
import { cn } from "@/lib/utils";

type DocsSidebarProps = {
  sections: readonly RegistrySectionWithItems[];
  pathname: string;
  className?: string;
  onNavigate?: () => void;
};

export function DocsSidebar({ sections, pathname, className, onNavigate }: DocsSidebarProps) {
  return (
    <nav className={cn("flex flex-col gap-4", className)}>
      <div data-sidebar-home className="flex flex-col gap-1">
        <Link
          to="/"
          onClick={onNavigate}
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Home
        </Link>
      </div>

      {sections.map((section) => (
        <DocsSidebarSection
          key={section.id}
          section={section}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

function DocsSidebarSection({
  section,
  pathname,
  onNavigate,
}: {
  section: RegistrySectionWithItems;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Link
        to={section.basePath}
        onClick={onNavigate}
        className="rounded-md px-3 py-1 text-sm font-semibold"
      >
        {section.title}
      </Link>
      <ul className="flex flex-col gap-0.5">
        {section.items.map((item) => {
          const href = `${section.basePath}/${item.name}`;
          const isActive = pathname === href;

          return (
            <li key={item.name}>
              <Link
                to={section.detailRoute}
                params={{ name: item.name }}
                onClick={onNavigate}
                className={cn(
                  "block truncate rounded-md px-3 py-1.5 text-sm transition-colors",
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
    </div>
  );
}
