import { defineRegistryItem, localRegistryDependency } from "@/lib/registry/metadata";

import { StatsPanel } from "./stats-panel";

export const registryItem = defineRegistryItem({
  name: "stats-panel",
  type: "registry:block",
  title: "Stats Panel",
  description: "A simple multi-file block with a component and local data helper.",
  registryDependencies: [localRegistryDependency("example-card"), "badge", "card"],
  files: [
    {
      path: "registry/items/blocks/stats-panel/stats-panel.tsx",
      type: "registry:block",
    },
    {
      path: "registry/items/blocks/stats-panel/stats-data.ts",
      type: "registry:lib",
    },
  ],
});

export function Preview() {
  return <StatsPanel />;
}
