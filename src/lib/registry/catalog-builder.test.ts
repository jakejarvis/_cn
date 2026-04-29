import { describe, expect, test } from "vitest";

import { createRegistryMetadataItems } from "./catalog-builder";

describe("createRegistryMetadataItems", () => {
  test("requires non-empty files for registry:page items", () => {
    expect(() =>
      createRegistryMetadataItems({
        "registry/items/pages/example/_registry.mdx": `---
name: example-page
type: registry:page
---
`,
      }),
    ).toThrow(/must declare a non-empty "files" array/u);
  });

  test("requires non-empty files for registry:file items", () => {
    expect(() =>
      createRegistryMetadataItems({
        "registry/items/files/example/_registry.mdx": `---
name: example-file
type: registry:file
---
`,
      }),
    ).toThrow(/must declare a non-empty "files" array/u);
  });

  test("allows registry:ui items without an explicit files array (default path)", () => {
    const items = createRegistryMetadataItems({
      "registry/items/components/example/_registry.mdx": `---
name: example-ui
type: registry:ui
---
`,
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.files?.length).toBeGreaterThan(0);
  });
});
