import type { RegistryCatalogItem } from "./catalog-builder";
import type { RegistryItemType } from "./item-types.ts";

export type RegistrySectionId = "components" | "blocks" | "utilities";

export type RegistryRouteItem = {
  name: string;
  type: RegistryItemType;
};

export type RegistrySectionConfig = {
  id: RegistrySectionId;
  title: string;
  description: string;
  basePath: `/${RegistrySectionId}`;
  types: readonly RegistryItemType[];
};

export type RegistrySectionWithItems<T extends RegistryRouteItem = RegistryCatalogItem> =
  RegistrySectionConfig & {
    items: T[];
  };

const componentRegistryTypes = [
  "registry:ui",
  "registry:component",
] as const satisfies readonly RegistryItemType[];

const blockRegistryTypes = ["registry:block"] as const satisfies readonly RegistryItemType[];

const utilityRegistryTypes = [
  "registry:base",
  "registry:font",
  "registry:lib",
  "registry:hook",
  "registry:page",
  "registry:file",
  "registry:style",
  "registry:theme",
  "registry:item",
] as const satisfies readonly RegistryItemType[];

export const registrySections = {
  components: {
    id: "components",
    title: "Components",
    description: "Installable UI primitives and components.",
    basePath: "/components",
    types: componentRegistryTypes,
  },
  blocks: {
    id: "blocks",
    title: "Blocks",
    description: "Composed templates and larger UI sections.",
    basePath: "/blocks",
    types: blockRegistryTypes,
  },
  utilities: {
    id: "utilities",
    title: "Utilities",
    description: "Hooks, libraries, pages, files, themes, fonts, bases, styles, and other items.",
    basePath: "/utilities",
    types: utilityRegistryTypes,
  },
} as const satisfies Record<RegistrySectionId, RegistrySectionConfig>;

export const registrySectionList = [
  registrySections.components,
  registrySections.blocks,
  registrySections.utilities,
] as const satisfies readonly RegistrySectionConfig[];

const registrySectionByType = {
  "registry:base": "utilities",
  "registry:block": "blocks",
  "registry:component": "components",
  "registry:font": "utilities",
  "registry:lib": "utilities",
  "registry:hook": "utilities",
  "registry:ui": "components",
  "registry:page": "utilities",
  "registry:file": "utilities",
  "registry:style": "utilities",
  "registry:theme": "utilities",
  "registry:item": "utilities",
} as const satisfies Record<RegistryItemType, RegistrySectionId>;

export function isRegistrySectionId(value: unknown): value is RegistrySectionId {
  return typeof value === "string" && registrySectionList.some((section) => section.id === value);
}

export function getRegistrySection(sectionId: string): RegistrySectionConfig | undefined {
  return isRegistrySectionId(sectionId) ? registrySections[sectionId] : undefined;
}

export function getRegistrySectionIdForType(type: RegistryItemType): RegistrySectionId {
  return registrySectionByType[type];
}

export function getRegistrySectionForType(type: RegistryItemType): RegistrySectionConfig {
  return registrySections[getRegistrySectionIdForType(type)];
}

export function getRegistryItemRoutePath(item: RegistryRouteItem): string {
  return `${getRegistrySectionForType(item.type).basePath}/${item.name}`;
}

export function getRegistrySectionsWithItems<T extends RegistryRouteItem>(
  items: readonly T[],
): RegistrySectionWithItems<T>[] {
  return registrySectionList
    .map((section) => toRegistrySectionWithItems(section, items))
    .filter((section) => section.items.length > 0);
}

export function getRegistrySectionWithItems<T extends RegistryRouteItem>(
  sectionId: string,
  items: readonly T[],
): RegistrySectionWithItems<T> | undefined {
  const section = getRegistrySection(sectionId);

  if (!section) {
    return undefined;
  }

  return toRegistrySectionWithItems(section, items);
}

export function getRegistrySectionItem<T extends RegistryRouteItem>(
  sectionId: string,
  itemName: string,
  items: readonly T[],
): T | undefined {
  const section = getRegistrySection(sectionId);

  if (!section) {
    return undefined;
  }

  return items.find(
    (item) => item.name === itemName && getRegistrySectionIdForType(item.type) === section.id,
  );
}

function toRegistrySectionWithItems<T extends RegistryRouteItem>(
  section: RegistrySectionConfig,
  items: readonly T[],
): RegistrySectionWithItems<T> {
  const sectionItems = getRegistryItemsForSection(items, section.id);

  return {
    ...section,
    items: sectionItems,
  };
}

function getRegistryItemsForSection<T extends RegistryRouteItem>(
  items: readonly T[],
  sectionId: RegistrySectionId,
): T[] {
  return items.filter((item) => getRegistrySectionIdForType(item.type) === sectionId);
}
