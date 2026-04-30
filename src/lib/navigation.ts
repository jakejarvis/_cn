import {
  getDocsNavigationSection,
  type DocsNavigationItem,
  type DocsNavigationSection,
} from "./docs/catalog";
import { getRegistryCatalogWithItems, registryItems } from "./registry/catalog";
import type { RegistryCatalogItem } from "./registry/catalog-builder";
import { getRegistryTypeLabel } from "./registry/item-types";
import {
  getRegistryItemRoutePath,
  getRegistrySection,
  getRegistrySectionIdForType,
  getRegistrySectionsWithItems,
  type RegistrySectionId,
} from "./registry/sections";

type RegistryNavigationItem = {
  kind: "registry";
  title: string;
  name: string;
  description: string;
  group: string;
  sectionId: RegistrySectionId;
  routePath: string;
};

type DocsNavigationEntry = DocsNavigationItem & {
  kind: "docs";
};

type RegistryNavigationSourceItem = Pick<
  RegistryCatalogItem,
  "description" | "name" | "title" | "type"
>;

export type SiteNavigationItem = RegistryNavigationItem | DocsNavigationEntry;

export type SiteNavigationSection = {
  id: "registry" | RegistrySectionId | DocsNavigationSection["id"];
  title: string;
  basePath: string;
  items: SiteNavigationItem[];
};

export type SiteNavigationSectionId = SiteNavigationSection["id"];

export function getSiteNavigationSections(): SiteNavigationSection[] {
  return createSiteNavigationSections({
    docsSection: getDocsNavigationSection(),
    registryItems,
  });
}

export function createSiteNavigationSections({
  docsSection,
  registryItems: registryNavigationItems,
}: {
  docsSection: DocsNavigationSection | null;
  registryItems: readonly RegistryNavigationSourceItem[];
}): SiteNavigationSection[] {
  return [
    createDocsSiteNavigationSection(docsSection),
    ...getRegistryNavigationSections(registryNavigationItems),
  ]
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

  if (id === "registry") {
    return getRegistryNavigationSection();
  }

  return getRegistryNavigationSectionById(id) ?? getRegistryNavigationSection();
}

function getDocsSiteNavigationSection(): SiteNavigationSection | null {
  return createDocsSiteNavigationSection(getDocsNavigationSection());
}

function createDocsSiteNavigationSection(
  section: DocsNavigationSection | null,
): SiteNavigationSection | null {
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

  return toRegistrySiteNavigationSection(catalog);
}

function getRegistryNavigationSections(
  items: readonly RegistryNavigationSourceItem[],
): SiteNavigationSection[] {
  return getRegistrySectionsWithItems(items).map(toRegistrySiteNavigationSection);
}

function getRegistryNavigationSectionById(sectionId: string): SiteNavigationSection | null {
  const config = getRegistrySection(sectionId);

  if (!config) {
    return null;
  }

  const section = getRegistrySectionsWithItems(registryItems).find(({ id }) => id === sectionId);

  return toRegistrySiteNavigationSection(section ?? { ...config, items: [] });
}

function toRegistrySiteNavigationSection(section: {
  id: "registry" | RegistrySectionId;
  title: string;
  basePath: string;
  items: readonly RegistryNavigationSourceItem[];
}): SiteNavigationSection {
  return {
    id: section.id,
    title: section.title,
    basePath: section.basePath,
    items: section.items.map(toRegistryNavigationItem),
  };
}

function toRegistryNavigationItem(item: RegistryNavigationSourceItem): RegistryNavigationItem {
  return {
    kind: "registry",
    title: item.title,
    name: item.name,
    description: item.description,
    group: getRegistryTypeLabel(item.type),
    sectionId: getRegistrySectionIdForType(item.type),
    routePath: getRegistryItemRoutePath(item),
  };
}
