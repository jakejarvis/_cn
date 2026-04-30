import { Link } from "@tanstack/react-router";

import type { SiteNavigationItem, SiteNavigationSection } from "../../lib/navigation";
import { cn } from "../../lib/utils";

type DocsSidebarProps = {
  sections: readonly SiteNavigationSection[];
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
  section: SiteNavigationSection;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <SidebarSectionLink section={section} onNavigate={onNavigate} />
      <SidebarItems items={section.items} pathname={pathname} onNavigate={onNavigate} />
    </div>
  );
}

function SidebarSectionLink({
  section,
  onNavigate,
}: {
  section: SiteNavigationSection;
  onNavigate?: () => void;
}) {
  const className = "rounded-md px-3 py-1 text-sm font-semibold";

  switch (section.id) {
    case "docs":
      return (
        <Link to="/docs" onClick={onNavigate} className={className}>
          {section.title}
        </Link>
      );
    case "components":
    case "blocks":
    case "utilities":
      return (
        <Link
          to="/$section"
          params={{ section: section.id }}
          onClick={onNavigate}
          className={className}
        >
          {section.title}
        </Link>
      );
    case "registry":
      return (
        <Link to="/registry" onClick={onNavigate} className={className}>
          {section.title}
        </Link>
      );
  }

  return null;
}

function SidebarItems({
  items,
  pathname,
  onNavigate,
}: {
  items: readonly SiteNavigationItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  let previousGroup: string | undefined;

  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const group = item.group;
        const showGroup = group && group !== previousGroup;
        previousGroup = group;

        return (
          <li key={`${item.kind}:${item.kind === "docs" ? item.slug : item.name}`}>
            {showGroup ? (
              <div className="px-3 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                {group}
              </div>
            ) : null}
            <SidebarItemLink item={item} pathname={pathname} onNavigate={onNavigate} />
          </li>
        );
      })}
    </ul>
  );
}

function SidebarItemLink({
  item,
  pathname,
  onNavigate,
}: {
  item: SiteNavigationItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive =
    item.kind === "docs" ? pathname === item.routePath : isRegistryItemActive(item, pathname);
  const className = cn(
    "block truncate rounded-md px-3 py-1.5 text-sm transition-colors",
    isActive
      ? "bg-accent font-medium text-accent-foreground"
      : "text-muted-foreground hover:text-foreground",
  );

  if (item.kind === "docs") {
    if (!item.slug) {
      return (
        <Link to="/docs" onClick={onNavigate} className={className}>
          {item.title}
        </Link>
      );
    }

    return (
      <Link
        to="/docs/$slug"
        params={{ slug: item.slug }}
        onClick={onNavigate}
        className={className}
      >
        {item.title}
      </Link>
    );
  }

  return (
    <Link
      to="/$section/$name"
      params={{ section: item.sectionId, name: item.name }}
      onClick={onNavigate}
      className={className}
    >
      {item.title}
    </Link>
  );
}

function isRegistryItemActive(
  item: Extract<SiteNavigationItem, { kind: "registry" }>,
  pathname: string,
) {
  return pathname === item.routePath;
}
