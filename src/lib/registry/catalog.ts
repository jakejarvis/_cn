import { normalizeGlobFiles } from "../glob";
import {
  createRegistryCatalogItems,
  createRegistryMetadataItems,
  type RegistryCatalogItem,
} from "./catalog-builder";

type RegistryType = RegistryCatalogItem["type"];

const registryItemSources = import.meta.glob<string>("../../../registry/items/**/_registry.mdx", {
  eager: true,
  import: "default",
  query: "?raw",
});

const registryItemSourcesByPath = normalizeGlobFiles(registryItemSources);

export const registryMetadataItems = createRegistryMetadataItems(registryItemSourcesByPath);
export const registryItems = createRegistryCatalogItems(registryItemSourcesByPath);

export function getRegistryItem(name: string): RegistryCatalogItem | undefined {
  return registryItems.find((item) => item.name === name);
}

export function getRegistryItemsByTypes(types: readonly RegistryType[]): RegistryCatalogItem[] {
  const typeSet = new Set(types);

  return registryItems.filter((item) => typeSet.has(item.type));
}
