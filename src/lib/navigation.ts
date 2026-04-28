import {
  getDocsNavigationSection,
  type DocsNavigationItem,
  type DocsNavigationSection,
} from "./docs/catalog";
import { getRegistryCatalogWithItems } from "./registry/catalog";
import { getRegistryTypeLabel } from "./registry/item-types";

type RegistryNavigationItem = {
  kind: "registry";
  title: string;
  name: string;
  description: string;
  group: string;
  routePath: string;
};

type DocsNavigationEntry = DocsNavigationItem & {
  kind: "docs";
};

export type SiteNavigationItem = RegistryNavigationItem | DocsNavigationEntry;

export type SiteNavigationSection = {
  id: "registry" | DocsNavigationSection["id"];
  title: "Registry" | DocsNavigationSection["title"];
  basePath: "/registry" | DocsNavigationSection["basePath"];
  items: SiteNavigationItem[];
};

export type SiteNavigationSectionId = SiteNavigationSection["id"];

export function getSiteNavigationSections(): SiteNavigationSection[] {
  return [getDocsSiteNavigationSection(), getRegistryNavigationSection()]
    .filter((section): section is SiteNavigationSection => section !== null)
    .filter((section) => section.items.length > 0);
}

export function getSiteNavigationSection(id: SiteNavigationSectionId): SiteNavigationSection {
  if (id === "docs") {
    return (
      getDocsSiteNavigationSection() ?? {
        id: "docs",
        title: "Docs",
        basePath: "/docs",
        items: [],
      }
    );
  }

  return getRegistryNavigationSection();
}

function getDocsSiteNavigationSection(): SiteNavigationSection | null {
  const section = getDocsNavigationSection();

  if (!section) {
    return null;
  }

  return {
    ...section,
    items: section.items.map(toDocsNavigationEntry),
  };
}

function toDocsNavigationEntry(item: DocsNavigationItem): DocsNavigationEntry {
  return {
    kind: "docs",
    title: item.title,
    description: item.description,
    slug: item.slug,
    routePath: item.routePath,
    ...(item.group ? { group: item.group } : {}),
  };
}

function getRegistryNavigationSection(): SiteNavigationSection {
  const catalog = getRegistryCatalogWithItems();

  return {
    id: catalog.id,
    title: catalog.title,
    basePath: catalog.basePath,
    items: catalog.items.map((item) => ({
      kind: "registry" as const,
      title: item.title,
      name: item.name,
      description: item.description,
      group: getRegistryTypeLabel(item.type),
      routePath: `${catalog.basePath}/${item.name}`,
    })),
  };
}
