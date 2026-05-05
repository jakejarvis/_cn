import { allRegistryNavigationItems } from "content-collections";

import { compareRegistryItemNames } from "./item-title";
import { registryCatalog } from "./item-types";

export type RegistryNavigationCatalogItem = (typeof allRegistryNavigationItems)[number];

export type RegistryNavigationCatalogWithItems = typeof registryCatalog & {
  items: RegistryNavigationCatalogItem[];
};

export const registryNavigationItems = [...allRegistryNavigationItems].toSorted(
  compareRegistryItemNames,
);

export function getRegistryNavigationCatalogWithItems(): RegistryNavigationCatalogWithItems {
  return {
    ...registryCatalog,
    items: registryNavigationItems,
  };
}
