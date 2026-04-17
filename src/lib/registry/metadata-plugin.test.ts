import { describe, expect, test } from "vitest";

import { extractRegistryMetadataModule } from "./metadata-plugin";

describe("registry metadata plugin", () => {
  test("extracts metadata from a client preview module", () => {
    const metadataModule = extractRegistryMetadataModule(
      `"use client";

import { Button } from "@/components/ui/button";
import { defineRegistryItem } from "@/lib/registry/metadata";

import { Toaster } from "./toast";

export const registryItem = defineRegistryItem({
  name: "toast",
  type: "registry:ui",
  title: "Toast",
  description: "A toast manager.",
});

export function Preview() {
  return <Button><Toaster /></Button>;
}
`,
      "/registry/items/components/toast/_registry.tsx",
    );

    expect(metadataModule).toContain(
      `import { defineRegistryItem } from "@/lib/registry/metadata";`,
    );
    expect(metadataModule).toContain(`name: "toast"`);
    expect(metadataModule).not.toContain(`from "@/components/ui/button"`);
    expect(metadataModule).not.toContain(`from "./toast"`);
    expect(metadataModule).not.toContain("Preview");
  });

  test("keeps registry metadata helpers used by the metadata object", () => {
    const metadataModule = extractRegistryMetadataModule(
      `import { defineRegistryItem, localRegistryDependency } from "@/lib/registry/metadata";

import { StatsPanel } from "./stats-panel";

export const registryItem = defineRegistryItem({
  name: "stats-panel",
  type: "registry:block",
  title: "Stats Panel",
  description: "A simple multi-file block with a component and local data helper.",
  registryDependencies: [localRegistryDependency("example-card"), "badge", "card"],
});

export function Preview() {
  return <StatsPanel />;
}
`,
      "/registry/items/blocks/stats-panel/_registry.tsx",
    );

    expect(metadataModule).toContain(
      `import { defineRegistryItem, localRegistryDependency } from "@/lib/registry/metadata";`,
    );
    expect(metadataModule).toContain(`localRegistryDependency("example-card")`);
    expect(metadataModule).not.toContain(`from "./stats-panel"`);
  });

  test("rejects indirect metadata definitions", () => {
    expect(() =>
      extractRegistryMetadataModule(
        `import { defineRegistryItem } from "@/lib/registry/metadata";

const metadata = {
  name: "toast",
};

export const registryItem = defineRegistryItem(metadata);
`,
        "/registry/items/components/toast/_registry.tsx",
      ),
    ).toThrow(/Use export const registryItem = defineRegistryItem\(\{ \.\.\. \}\)/u);
  });
});
