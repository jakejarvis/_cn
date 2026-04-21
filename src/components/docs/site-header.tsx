import { IconBrandGithub, IconMenu2 } from "@tabler/icons-react";
import { Link, useRouterState } from "@tanstack/react-router";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getSiteNavigationSections, type SiteNavigationSection } from "@/lib/navigation";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

import { DocsSidebar } from "./docs-sidebar";
import { SearchDialog } from "./search-dialog";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const [open, setOpen] = React.useState(false);
  const visibleSections = getSiteNavigationSections();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-4 px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
            <IconMenu2 data-icon />
            <span className="sr-only">Toggle menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-66! bg-background/96 p-0 backdrop-blur-lg">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <DocsSidebar
              sections={visibleSections}
              pathname={pathname}
              className="overflow-y-auto p-4 pt-12"
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center gap-2.5">
          <RegistryLogo className="size-5 shrink-0" aria-hidden="true" />
          <span className="font-mono text-sm font-semibold tracking-tighter">
            {siteConfig.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {visibleSections.map((section) => (
            <HeaderSectionLink key={section.id} section={section} pathname={pathname} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <SearchDialog />
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={<a href={siteConfig.repositoryUrl} target="_blank" rel="noopener noreferrer" />}
          >
            <IconBrandGithub data-icon />
            <span className="sr-only">GitHub</span>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function HeaderSectionLink({
  section,
  pathname,
}: {
  section: SiteNavigationSection;
  pathname: string;
}) {
  const className = cn(
    "rounded-md px-3 py-1.5 text-sm transition-colors hover:text-foreground",
    isSectionActive(section, pathname) ? "text-foreground" : "text-muted-foreground",
  );

  switch (section.id) {
    case "docs":
      return (
        <Link to="/docs" className={className}>
          {section.title}
        </Link>
      );
    case "components":
      return (
        <Link to="/components" className={className}>
          {section.title}
        </Link>
      );
    case "blocks":
      return (
        <Link to="/blocks" className={className}>
          {section.title}
        </Link>
      );
    case "utilities":
      return (
        <Link to="/utilities" className={className}>
          {section.title}
        </Link>
      );
  }

  return null;
}

function isSectionActive(section: SiteNavigationSection, pathname: string) {
  return pathname === section.basePath || pathname.startsWith(`${section.basePath}/`);
}

function RegistryLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" focusable="false" {...props}>
      <rect width="13" height="13" x="3" y="3" rx="3" fill="currentColor" />
      <rect width="13" height="13" x="16" y="3" rx="3" fill="currentColor" opacity="0.35" />
      <rect width="13" height="13" x="3" y="16" rx="3" fill="currentColor" opacity="0.35" />
      <rect width="13" height="13" x="16" y="16" rx="3" fill="currentColor" />
    </svg>
  );
}
