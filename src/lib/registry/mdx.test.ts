import { describe, expect, test } from "vitest";

import { parseRegistryMdx } from "./mdx";

describe("registry MDX parser", () => {
  test("extracts frontmatter metadata, usage presence, and preview source", () => {
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
  - example-card
files:
  - path: registry/items/components/toast/toast.tsx
    type: registry:ui
---

import {
  Toast
} from "./toast";

Use the toast component from any client component.

\`\`\`tsx
import { Toast } from "@/components/ui/toast";

export function Example() {
  return <Toast />;
}
\`\`\`

export function Preview() {
  return <Toast />;
}
`,
    );

    expect(parsed.registryItem).toMatchObject({
      name: "toast",
      type: "registry:ui",
      title: "Toast",
      description: "A toast manager.",
      registryDependencies: ["button", "https://underscore-cn.vercel.app/example-card.json"],
      files: [
        {
          path: "registry/items/components/toast/toast.tsx",
          type: "registry:ui",
        },
      ],
    });
    expect(parsed.hasUsage).toBe(true);
    expect(parsed.previewSource).toContain(`from "./toast"`);
    expect(parsed.previewSource).not.toContain(`from "@/components/ui/toast"`);
    expect(parsed.previewSource).toContain("export function Preview");
  });

  test("preserves preview source indentation", () => {
    const parsed = parseRegistryMdx(
      "registry/items/components/copy-button/_registry.mdx",
      `---
name: copy-button
type: registry:ui
title: Copy Button
description: A copy button.
---

import { Button } from "./button";

export function Preview() {
  return (
    <div className="flex flex-col gap-3">
      <Button>Copy</Button>
      <p>Ready</p>
    </div>
  );
}
`,
    );

    expect(parsed.previewSource).toContain("  return (");
    expect(parsed.previewSource).toContain("    <div");
    expect(parsed.previewSource).toContain("      <Button>Copy</Button>");
    expect(parsed.previewSource).toContain("      <p>Ready</p>");
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

export function Preview() {
  return null;
}
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

import { Toast } from "./toast";

export function Preview() {
  return <Toast />;
}
`,
    );

    expect(parsed.hasUsage).toBe(false);
  });

  test("rejects missing frontmatter", () => {
    expect(() =>
      parseRegistryMdx(
        "registry/items/components/toast/_registry.mdx",
        `import { Toast } from "./toast";`,
      ),
    ).toThrow(/must start with YAML frontmatter/u);
  });

  test("wraps invalid YAML errors with the registry item path", () => {
    expect(() =>
      parseRegistryMdx(
        "registry/items/components/toast/_registry.mdx",
        `---
name: [toast
---

export function Preview() {
  return null;
}
`,
      ),
    ).toThrow(
      /Registry item registry\/items\/components\/toast\/_registry\.mdx contains invalid YAML frontmatter:/u,
    );
  });
});
