import { defineRegistryItem } from "@/lib/registry/metadata";

import { ExampleCard } from "./example-card";

export const registryItem = defineRegistryItem({
  name: "example-card",
  type: "registry:ui",
  title: "Example Card",
  description: "A compact card component that demonstrates shadcn registry dependencies.",
  registryDependencies: ["badge", "button", "card"],
});

export function Preview() {
  return <ExampleCard />;
}
