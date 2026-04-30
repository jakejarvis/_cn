import type { RegistryItem as ShadcnRegistryItem } from "shadcn/schema";

export type PrivateRegistryItemType = "registry:example" | "registry:internal";
export type RegistryItemType = Exclude<ShadcnRegistryItem["type"], PrivateRegistryItemType>;

export const publicRegistryItemTypes = [
  "registry:base",
  "registry:block",
  "registry:component",
  "registry:font",
  "registry:lib",
  "registry:hook",
  "registry:ui",
  "registry:page",
  "registry:file",
  "registry:style",
  "registry:theme",
  "registry:item",
] as const satisfies readonly RegistryItemType[];

export const registryTypeFolders = {
  "registry:base": "bases",
  "registry:block": "blocks",
  "registry:component": "components",
  "registry:font": "fonts",
  "registry:lib": "lib",
  "registry:hook": "hooks",
  "registry:ui": "components",
  "registry:page": "pages",
  "registry:file": "files",
  "registry:style": "styles",
  "registry:theme": "themes",
  "registry:item": "items",
} as const satisfies Record<RegistryItemType, string>;

export const registryTypeLabels = {
  "registry:base": "Bases",
  "registry:block": "Blocks",
  "registry:component": "Components",
  "registry:font": "Fonts",
  "registry:lib": "Libraries",
  "registry:hook": "Hooks",
  "registry:ui": "UI",
  "registry:page": "Pages",
  "registry:file": "Files",
  "registry:style": "Styles",
  "registry:theme": "Themes",
  "registry:item": "Items",
} as const satisfies Record<RegistryItemType, string>;

export const registryCatalog = {
  id: "registry",
  title: "Registry",
  description: "Installable shadcn-compatible registry items.",
  basePath: "/registry",
} as const;

export function isPublicRegistryItemType(value: unknown): value is RegistryItemType {
  return (
    typeof value === "string" &&
    publicRegistryItemTypes.some((registryType) => registryType === value)
  );
}

export function getRegistryTypeFolder(type: RegistryItemType): string {
  return registryTypeFolders[type];
}

export function getRegistryTypeLabel(type: RegistryItemType): string {
  return registryTypeLabels[type];
}
