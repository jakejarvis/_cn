import { getRegistryItemsByTypes, type RegistryCatalogItem } from "./catalog";
import {
  registrySectionList,
  registrySections,
  type RegistrySection,
  type RegistrySectionConfig,
} from "./sections";

type RegistrySectionWithItems = RegistrySectionConfig & {
  items: RegistryCatalogItem[];
};

export function getRegistrySectionItems(section: RegistrySection): RegistryCatalogItem[] {
  return getRegistryItemsByTypes(registrySections[section].registryTypes);
}

export function getRegistrySectionsWithItems(): RegistrySectionWithItems[] {
  return registrySectionList.flatMap((section) => {
    const items = getRegistrySectionItems(section.id);

    return items.length > 0 ? [{ ...section, items }] : [];
  });
}
