export const registryDetailTypes = [
  "registry:block",
  "registry:component",
  "registry:hook",
  "registry:lib",
  "registry:ui",
] as const;
const registryDetailTypeSet = new Set<string>(registryDetailTypes);

export type RegistryDetailType = (typeof registryDetailTypes)[number];

export type RegistryItemDetailInput = {
  name: string;
  expectedTypes: RegistryDetailType[];
};

export function isRegistryDetailType(value: unknown): value is RegistryDetailType {
  return typeof value === "string" && registryDetailTypeSet.has(value);
}
