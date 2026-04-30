import { describe, expect, test } from "vitest";

import { createRegistryCatalogItems, createRegistryMetadataItems } from "./catalog-builder";

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
    expect(items[0]?.files).toEqual([
      {
        path: "ui/example-ui.tsx",
        type: "registry:ui",
      },
    ]);
  });

  test("derives public install paths from item-relative source paths", () => {
    const items = createRegistryCatalogItems({
      "registry/items/hooks/use-example/_registry.mdx": `---
name: use-example
type: registry:hook
files:
  - path: use-example.ts
    type: registry:hook
---
`,
    });

    expect(items[0]?.files).toEqual([
      {
        path: "hooks/use-example.ts",
        type: "registry:hook",
      },
    ]);
    expect(items[0]?.sourceFiles).toMatchObject([
      {
        path: "hooks/use-example.ts",
        sourcePath: "registry/items/hooks/use-example/use-example.ts",
        type: "registry:hook",
      },
    ]);
  });

  test("uses nested item-relative paths as source paths", () => {
    const items = createRegistryCatalogItems({
      "registry/items/hooks/use-example/_registry.mdx": `---
name: use-example
type: registry:hook
files:
  - path: hooks/use-example.ts
    type: registry:hook
---
`,
    });

    expect(items[0]?.files).toEqual([
      {
        path: "hooks/use-example.ts",
        type: "registry:hook",
      },
    ]);
    expect(items[0]?.sourceFiles[0]?.sourcePath).toBe(
      "registry/items/hooks/use-example/hooks/use-example.ts",
    );
  });

  test("preserves target-based relative file paths because target controls installation", () => {
    const items = createRegistryCatalogItems({
      "registry/items/pages/example/_registry.mdx": `---
name: example-page
type: registry:page
files:
  - path: page.tsx
    type: registry:page
    target: app/example/page.tsx
---
`,
    });

    expect(items[0]?.files).toEqual([
      {
        path: "page.tsx",
        type: "registry:page",
        target: "app/example/page.tsx",
      },
    ]);
    expect(items[0]?.sourceFiles[0]?.sourcePath).toBe("registry/items/pages/example/page.tsx");
  });

  test("derives public install paths from nested item-relative file names", () => {
    const items = createRegistryCatalogItems({
      "registry/items/components/example/_registry.mdx": `---
name: example-card
type: registry:ui
files:
  - path: src/example-card.tsx
    type: registry:ui
---
`,
    });

    expect(items[0]?.files).toEqual([
      {
        path: "ui/example-card.tsx",
        type: "registry:ui",
      },
    ]);
    expect(items[0]?.sourceFiles[0]?.sourcePath).toBe(
      "registry/items/components/example/src/example-card.tsx",
    );
  });

  test("does not normalize unsafe file paths before validation can report them", () => {
    const items = createRegistryCatalogItems({
      "registry/items/components/example/_registry.mdx": `---
name: example-card
type: registry:ui
files:
  - path: ../example-card.tsx
    type: registry:ui
  - path: /example-card.tsx
    type: registry:ui
  - path: ~/example-card.tsx
    type: registry:ui
---
`,
    });

    expect(items[0]?.files).toEqual([
      {
        path: "../example-card.tsx",
        type: "registry:ui",
      },
      {
        path: "/example-card.tsx",
        type: "registry:ui",
      },
      {
        path: "~/example-card.tsx",
        type: "registry:ui",
      },
    ]);
  });
});
