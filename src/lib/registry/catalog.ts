import { allRegistryMdxItems, allRegistryPreviews } from "content-collections";

import {
  createRegistryCatalogItemsFromEntries,
  createRegistryMetadataItemsFromEntries,
  type RegistryCatalogItem,
} from "./catalog-builder";
import { registryCatalog } from "./item-types";

export type RegistryCatalogWithItems = typeof registryCatalog & {
  items: RegistryCatalogItem[];
};

export const registryMetadataItems = createRegistryMetadataItemsFromEntries(allRegistryMdxItems);
export const registryItems = createRegistryCatalogItemsFromEntries(
  allRegistryMdxItems,
  allRegistryPreviews,
);

export function getRegistryItem(name: string): RegistryCatalogItem | undefined {
  return registryItems.find((item) => item.name === name);
}

export function getRegistryItemsByTypes(
  types: readonly RegistryCatalogItem["type"][],
): RegistryCatalogItem[] {
  const typeSet = new Set(types);

  return registryItems.filter((item) => typeSet.has(item.type));
}

export function getRegistryCatalogWithItems(): RegistryCatalogWithItems {
  return {
    ...registryCatalog,
    items: registryItems,
  };
}
