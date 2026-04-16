import { IconBrandGithub, IconMenu2 } from "@tabler/icons-react";
import { Link, useRouterState } from "@tanstack/react-router";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  getRegistrySectionsWithItems,
  type RegistrySectionWithItems,
} from "@/lib/registry/sections";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

import { DocsSidebar } from "./docs-sidebar";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const [open, setOpen] = React.useState(false);
  const visibleSections = getRegistrySectionsWithItems();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
            <IconMenu2 data-icon />
            <span className="sr-only">Toggle menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <MobileNav
              sections={visibleSections}
              pathname={pathname}
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
            <Link
              key={section.id}
              to={section.basePath}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors hover:text-foreground",
                pathname.startsWith(section.basePath) ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {section.title}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
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

function MobileNav({
  sections,
  pathname,
  onNavigate,
}: {
  sections: RegistrySectionWithItems[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 overflow-y-auto p-4 pt-12">
      <div className="flex flex-col gap-1">
        <Link
          to="/"
          onClick={onNavigate}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors hover:text-foreground",
            pathname === "/" ? "font-medium text-foreground" : "text-muted-foreground",
          )}
        >
          Home
        </Link>
        {sections.map((section) => (
          <Link
            key={section.id}
            to={section.basePath}
            onClick={onNavigate}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors hover:text-foreground",
              pathname.startsWith(section.basePath)
                ? "font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            {section.title}
          </Link>
        ))}
      </div>

      {sections.map((section) => (
        <DocsSidebar
          key={section.id}
          title={section.title}
          items={section.items}
          basePath={section.basePath}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
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
