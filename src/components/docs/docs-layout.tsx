import { useRouterState } from "@tanstack/react-router";
import type * as React from "react";

import {
  getRegistrySectionItems,
  registrySections,
  type RegistrySection,
} from "@/lib/registry/sections";

import { DocsSidebar } from "./docs-sidebar";

type DocsLayoutProps = {
  section: RegistrySection;
  children: React.ReactNode;
};

export function DocsLayout({ section, children }: DocsLayoutProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const sectionConfig = registrySections[section];
  const items = getRegistrySectionItems(section);
  const sidebarSections = [{ ...sectionConfig, items }];

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl gap-8 px-4 sm:px-6 lg:px-8">
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto py-8 lg:block">
        <DocsSidebar
          sections={sidebarSections}
          pathname={pathname}
          className="[&_[data-sidebar-home]]:hidden"
        />
      </aside>
      <main className="min-w-0 flex-1 py-8">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
