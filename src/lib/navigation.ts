import {
  getDocsNavigationSection,
  type DocsNavigationItem,
  type DocsNavigationSection,
} from "@/lib/docs/catalog";
import {
  registrySectionList,
  registrySections,
  type RegistrySection,
  type RegistrySectionConfig,
} from "@/lib/registry/section-config";
import { getRegistrySectionItems } from "@/lib/registry/sections";

type RegistryNavigationItem = {
  kind: "registry";
  section: RegistrySection;
  title: string;
  name: string;
  description: string;
};

type DocsNavigationEntry = DocsNavigationItem & {
  kind: "docs";
};

export type SiteNavigationItem = RegistryNavigationItem | DocsNavigationEntry;

export type SiteNavigationSection = {
  id: RegistrySection | DocsNavigationSection["id"];
  title: RegistrySectionConfig["title"] | DocsNavigationSection["title"];
  basePath: RegistrySectionConfig["basePath"] | DocsNavigationSection["basePath"];
  items: SiteNavigationItem[];
};

export type SiteNavigationSectionId = SiteNavigationSection["id"];

export function getSiteNavigationSections(): SiteNavigationSection[] {
  return [getDocsSiteNavigationSection(), ...registrySectionList.map(toRegistryNavigationSection)]
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

  return toRegistryNavigationSection(registrySections[id]);
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
  const entry: DocsNavigationEntry = {
    kind: "docs",
    title: item.title,
    description: item.description,
    slug: item.slug,
    routePath: item.routePath,
  };

  return item.group ? Object.assign(entry, { group: item.group }) : entry;
}

function toRegistryNavigationSection(section: (typeof registrySectionList)[number]) {
  return {
    id: section.id,
    title: section.title,
    basePath: section.basePath,
    items: getRegistrySectionItems(section.id).map((item) => ({
      kind: "registry" as const,
      section: section.id,
      title: item.title,
      name: item.name,
      description: item.description,
    })),
  };
}
