import { describe, expect, test } from "vitest";

import { getRegistryDiagnostics, getRegistryDoctorExitCode } from "./diagnostics";

describe("registry diagnostics", () => {
  test("accepts a valid registry item and docs page", () => {
    const diagnostics = getRegistryDiagnostics({
      files: {
        ...getValidRegistryFiles(),
        "registry/docs/index.mdx": "# Docs",
      },
    });

    expect(diagnostics.errors).toEqual([]);
    expect(diagnostics.warnings).toEqual([]);
  });

  test("reports missing published source files as errors", () => {
    const { "registry/items/components/example-card/example-card.tsx": _source, ...files } =
      getValidRegistryFiles();
    const diagnostics = getRegistryDiagnostics({ files });

    expect(diagnostics.errors).toContainEqual({
      level: "error",
      path: "registry/items/components/example-card/example-card.tsx",
      message:
        'Registry item "example-card" references a missing file: registry/items/components/example-card/example-card.tsx',
    });
  });

  test("accepts arbitrary published text source files", () => {
    const diagnostics = getRegistryDiagnostics({
      files: {
        "registry/items/components/example-card/_registry.mdx": getRegistryMdx({
          files: [
            {
              path: "registry/items/components/example-card/README.md",
              type: "registry:ui",
            },
          ],
        }),
        "registry/items/components/example-card/README.md": "# Example card",
      },
    });

    expect(diagnostics.errors).toEqual([]);
  });

  test("warns about supported source files that the item does not publish", () => {
    const diagnostics = getRegistryDiagnostics({
      files: {
        ...getValidRegistryFiles(),
        "registry/items/components/example-card/demo.tsx": "export function Demo() {}",
      },
    });

    expect(diagnostics.errors).toEqual([]);
    expect(diagnostics.warnings).toContainEqual({
      level: "warning",
      path: "registry/items/components/example-card/demo.tsx",
      message: 'Registry item "example-card" does not publish this source file.',
    });
  });

  test("warns about item-like folders without registry metadata", () => {
    const diagnostics = getRegistryDiagnostics({
      files: {
        "registry/items/components/orphan/orphan.tsx": "export function Orphan() {}",
      },
    });

    expect(diagnostics.errors).toEqual([]);
    expect(diagnostics.warnings).toContainEqual({
      level: "warning",
      path: "registry/items/components/orphan",
      message: "Registry item folder contains source files but no _registry.mdx.",
    });
  });

  test("warns about unpublished files inside item folders", () => {
    const diagnostics = getRegistryDiagnostics({
      files: {
        ...getValidRegistryFiles(),
        "registry/items/components/example-card/README.md": "# Internal notes",
      },
    });

    expect(diagnostics.errors).toEqual([]);
    expect(diagnostics.warnings).toContainEqual({
      level: "warning",
      path: "registry/items/components/example-card/README.md",
      message: 'Registry item "example-card" does not publish this source file.',
    });
  });

  test("reports nested docs pages consistently with docs catalog rules", () => {
    const diagnostics = getRegistryDiagnostics({
      files: {
        ...getValidRegistryFiles(),
        "registry/docs/guides/install.mdx": "# Install",
      },
    });

    expect(diagnostics.errors).toContainEqual({
      level: "error",
      path: "registry/docs/guides/install.mdx",
      message:
        "Nested docs pages are not supported yet. Move registry/docs/guides/install.mdx directly under registry/docs.",
    });
  });

  test("does not fail the doctor command for warnings only", () => {
    const diagnostics = getRegistryDiagnostics({
      files: {
        ...getValidRegistryFiles(),
        "registry/items/components/example-card/README.md": "# Internal notes",
      },
    });

    expect(diagnostics.errors).toEqual([]);
    expect(diagnostics.warnings).toHaveLength(1);
    expect(getRegistryDoctorExitCode(diagnostics)).toBe(0);
  });
});

function getValidRegistryFiles(): Record<string, string> {
  return {
    "registry/items/components/example-card/_registry.mdx": getRegistryMdx(),
    "registry/items/components/example-card/example-card.tsx": "export function ExampleCard() {}",
  };
}

function getRegistryMdx(
  options: {
    files?: {
      path: string;
      type: string;
    }[];
  } = {},
): string {
  const files = options.files
    ? `\nfiles:\n${options.files.map((file) => `  - path: ${file.path}\n    type: ${file.type}`).join("\n")}`
    : "";

  return `---
name: example-card
type: registry:ui
title: Example Card
description: A test card.${files}
---

Use this card in examples.

export function Preview() {
  return <div>Preview</div>
}
`;
}
