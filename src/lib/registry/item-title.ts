import type { RegistryItemDefinition } from "./metadata";

const registryItemCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

export function compareRegistryItemNames(
  a: Pick<RegistryItemDefinition, "name" | "title">,
  b: Pick<RegistryItemDefinition, "name" | "title">,
): number {
  return (
    registryItemCollator.compare(
      a.title ?? getDefaultRegistryTitle(a.name),
      b.title ?? getDefaultRegistryTitle(b.name),
    ) || registryItemCollator.compare(a.name, b.name)
  );
}

export function getDefaultRegistryTitle(name: string): string {
  return name
    .split("-")
    .map((segment) => `${segment.slice(0, 1).toUpperCase()}${segment.slice(1)}`)
    .join(" ");
}
