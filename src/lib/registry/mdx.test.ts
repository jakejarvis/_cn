import { describe, expect, test } from "vitest";

import { getCanonicalRegistryItemUrl } from "../site-config";
import { parseRegistryMdx, parseRegistryMdxDocument } from "./mdx";

describe("registry MDX parser", () => {
  test("extracts frontmatter metadata and usage source", () => {
    const parsed = parseRegistryMdx(
      "registry/items/components/toast/_registry.mdx",
      `---
name: toast
type: registry:ui
title: Toast
description: A toast manager.
registryDependencies:
  - button
localRegistryDependencies:
  - alpha-card
files:
  - path: toast.tsx
    type: registry:ui
---

Use the toast component from any client component.

\`\`\`tsx
import { Toast } from "@/components/ui/toast";

export function Example() {
  return <Toast />;
}
\`\`\`
`,
    );

    expect(parsed.registryItem).toMatchObject({
      name: "toast",
      type: "registry:ui",
      title: "Toast",
      description: "A toast manager.",
      registryDependencies: ["button", getCanonicalRegistryItemUrl("alpha-card")],
      files: [
        {
          path: "toast.tsx",
          type: "registry:ui",
        },
      ],
    });
    expect(parsed.hasUsage).toBe(true);
    expect(parsed.usageSource).toBe(`Use the toast component from any client component.

\`\`\`tsx
import { Toast } from "@/components/ui/toast";

export function Example() {
  return <Toast />;
}
\`\`\``);
  });

  test("parses content collections frontmatter documents", () => {
    const parsed = parseRegistryMdxDocument(
      "registry/items/components/toast/_registry.mdx",
      {
        name: "toast",
        type: "registry:ui",
        title: "Toast",
        description: "A toast manager.",
      },
      "Use the toast component.",
    );

    expect(parsed.registryItem.name).toBe("toast");
    expect(parsed.hasUsage).toBe(true);
    expect(parsed.usageSource).toBe("Use the toast component.");
  });

  test("rejects sourcePath frontmatter file entries", () => {
    expect(() =>
      parseRegistryMdx(
        "registry/items/components/toast/_registry.mdx",
        `---
name: toast
type: registry:ui
files:
  - path: toast.tsx
    sourcePath: registry/items/components/toast/toast.tsx
    type: registry:ui
---
`,
      ),
    ).toThrow(/contains an invalid file entry/u);
  });

  test("preserves shadcn docs metadata separately from mdx body usage", () => {
    const parsed = parseRegistryMdx(
      "registry/items/components/toast/_registry.mdx",
      `---
name: toast
type: registry:ui
title: Toast
description: A toast manager.
docs: This appears during shadcn CLI install.
---

This renders on the docs site.
`,
    );

    expect(parsed.registryItem.docs).toBe("This appears during shadcn CLI install.");
    expect(parsed.hasUsage).toBe(true);
  });

  test("detects items without usage content", () => {
    const parsed = parseRegistryMdx(
      "registry/items/components/toast/_registry.mdx",
      `---
name: toast
type: registry:ui
title: Toast
description: A toast manager.
---
`,
    );

    expect(parsed.hasUsage).toBe(false);
    expect(parsed.usageSource).toBe("");
  });

  test("allows optional title, description, and files", () => {
    const parsed = parseRegistryMdx(
      "registry/items/themes/brand-theme/_registry.mdx",
      `---
name: brand-theme
type: registry:theme
cssVars:
  theme:
    font-heading: Inter, sans-serif
---
`,
    );

    expect(parsed.registryItem).toMatchObject({
      name: "brand-theme",
      type: "registry:theme",
      cssVars: {
        theme: {
          "font-heading": "Inter, sans-serif",
        },
      },
    });
    expect(parsed.registryItem).not.toHaveProperty("files");
  });

  test("rejects MDX imports or exports", () => {
    expect(() =>
      parseRegistryMdx(
        "registry/items/components/toast/_registry.mdx",
        `---
name: toast
type: registry:ui
title: Toast
description: A toast manager.
---

import { Toast } from "./toast";

Use the toast component.
`,
      ),
    ).toThrow(/must not contain MDX imports or exports/u);
  });

  test("accepts every public registry item type", () => {
    const fixtures = [
      ["registry:base", "config:\n  style: custom-base\n  tailwind:\n    baseColor: neutral"],
      ["registry:block", ""],
      ["registry:component", ""],
      [
        "registry:font",
        "font:\n  family: \"'Inter Variable', sans-serif\"\n  provider: google\n  import: Inter\n  variable: --font-sans",
      ],
      ["registry:lib", ""],
      ["registry:hook", ""],
      ["registry:ui", ""],
      ["registry:page", ""],
      ["registry:file", ""],
      ["registry:style", 'css:\n  "@layer base":\n    h1:\n      font-size: var(--text-2xl)'],
      ["registry:theme", "cssVars:\n  theme:\n    font-heading: Inter, sans-serif"],
      ["registry:item", "envVars:\n  NEXT_PUBLIC_APP_URL: http://localhost:4000"],
    ] as const;

    for (const [type, extraFrontmatter] of fixtures) {
      const parsed = parseRegistryMdx(
        `registry/items/items/${type.replace("registry:", "")}/_registry.mdx`,
        `---
name: ${type.replace("registry:", "")}-fixture
type: ${type}
${extraFrontmatter}
---
`,
      );

      expect(parsed.registryItem.type).toBe(type);
    }
  });

  test("rejects private registry item types", () => {
    expect(() =>
      parseRegistryMdx(
        "registry/items/internal/example/_registry.mdx",
        `---
name: example
type: registry:internal
---
`,
      ),
    ).toThrow(/unsupported type "registry:internal"/u);
  });

  test("requires font metadata only for registry font items", () => {
    expect(() =>
      parseRegistryMdx(
        "registry/items/fonts/inter/_registry.mdx",
        `---
name: inter
type: registry:font
---
`,
      ),
    ).toThrow(/must include font metadata/u);

    expect(() =>
      parseRegistryMdx(
        "registry/items/themes/theme/_registry.mdx",
        `---
name: theme
type: registry:theme
font:
  family: Inter
  provider: google
  import: Inter
  variable: --font-sans
---
`,
      ),
    ).toThrow(/must not include font metadata/u);
  });

  test("rejects missing frontmatter", () => {
    expect(() =>
      parseRegistryMdx("registry/items/components/toast/_registry.mdx", `Use the toast component.`),
    ).toThrow(/must start with YAML frontmatter/u);
  });

  test("wraps invalid YAML errors with the registry item path", () => {
    expect(() =>
      parseRegistryMdx(
        "registry/items/components/toast/_registry.mdx",
        `---
name: [toast
---
`,
      ),
    ).toThrow(
      /Registry item registry\/items\/components\/toast\/_registry\.mdx contains invalid YAML frontmatter:/u,
    );
  });
});
