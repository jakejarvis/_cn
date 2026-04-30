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

  const section = getRegistryNavigationSectionById(id);

  if (section) {
    return section;
  }

  const config = getRegistrySection(id);

  if (config) {
    return {
      ...config,
      items: [],
    };
  }

  return getRegistryNavigationSection();
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

  return {
    id: catalog.id,
    title: catalog.title,
    basePath: catalog.basePath,
    items: catalog.items.map(toRegistryNavigationItem),
  };
}

function getRegistryNavigationSections(
  items: readonly RegistryNavigationSourceItem[],
): SiteNavigationSection[] {
  return getRegistrySectionsWithItems(items).map((section) => ({
    id: section.id,
    title: section.title,
    basePath: section.basePath,
    items: section.items.map(toRegistryNavigationItem),
  }));
}

function getRegistryNavigationSectionById(
  sectionId: RegistrySectionId,
): SiteNavigationSection | null {
  const section = getRegistrySectionsWithItems(registryItems).find(({ id }) => id === sectionId);

  if (!section) {
    const config = getRegistrySection(sectionId);

    return config
      ? {
          ...config,
          items: [],
        }
      : null;
  }

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
