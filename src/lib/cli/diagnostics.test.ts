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
    const { "registry/items/components/fixture-card/fixture-card.tsx": _source, ...files } =
      getValidRegistryFiles();
    const diagnostics = getRegistryDiagnostics({ files });

    expect(diagnostics.errors).toContainEqual({
      level: "error",
      path: "registry/items/components/fixture-card/fixture-card.tsx",
      message:
        'Registry item "fixture-card" references a missing file: registry/items/components/fixture-card/fixture-card.tsx',
    });
  });

  test("accepts arbitrary published text source files", () => {
    const diagnostics = getRegistryDiagnostics({
      files: {
        "registry/items/components/fixture-card/_registry.mdx": getRegistryMdx({
          files: [
            {
              path: "README.md",
              type: "registry:ui",
            },
          ],
        }),
        "registry/items/components/fixture-card/README.md": "# Fixture card",
      },
    });

    expect(diagnostics.errors).toEqual([]);
  });

  test("warns about supported source files that the item does not publish", () => {
    const diagnostics = getRegistryDiagnostics({
      files: {
        ...getValidRegistryFiles(),
        "registry/items/components/fixture-card/demo.tsx": "export function Demo() {}",
      },
    });

    expect(diagnostics.errors).toEqual([]);
    expect(diagnostics.warnings).toContainEqual({
      level: "warning",
      path: "registry/items/components/fixture-card/demo.tsx",
      message: 'Registry item "fixture-card" does not publish this source file.',
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

  test("does not warn about orphan folders that only contain ignored files", () => {
    const diagnostics = getRegistryDiagnostics({
      files: {
        "registry/items/components/empty-ish/.DS_Store": "",
      },
    });

    expect(diagnostics.errors).toEqual([]);
    expect(diagnostics.warnings).toEqual([]);
  });

  test("warns about unpublished files inside item folders", () => {
    const diagnostics = getRegistryDiagnostics({
      files: {
        ...getValidRegistryFiles(),
        "registry/items/components/fixture-card/README.md": "# Internal notes",
      },
    });

    expect(diagnostics.errors).toEqual([]);
    expect(diagnostics.warnings).toContainEqual({
      level: "warning",
      path: "registry/items/components/fixture-card/README.md",
      message: 'Registry item "fixture-card" does not publish this source file.',
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

  test("reports unsafe registry file paths before they are normalized away", () => {
    for (const path of ["../fixture-card.tsx", "/fixture-card.tsx", "~/fixture-card.tsx"]) {
      const diagnostics = getRegistryDiagnostics({
        files: {
          "registry/items/components/fixture-card/_registry.mdx": getRegistryMdx({
            files: [
              {
                path,
                type: "registry:ui",
              },
            ],
          }),
          "registry/items/components/fixture-card/fixture-card.tsx":
            "export function FixtureCard() {}",
        },
      });

      expect(diagnostics.errors).toContainEqual({
        level: "error",
        path,
        message: `Registry item "fixture-card" contains an invalid install path: ${path}`,
      });
    }
  });

  test("does not fail the doctor command for warnings only", () => {
    const diagnostics = getRegistryDiagnostics({
      files: {
        ...getValidRegistryFiles(),
        "registry/items/components/fixture-card/README.md": "# Internal notes",
      },
    });

    expect(diagnostics.errors).toEqual([]);
    expect(diagnostics.warnings).toHaveLength(1);
    expect(getRegistryDoctorExitCode(diagnostics)).toBe(0);
  });
});

function getValidRegistryFiles(): Record<string, string> {
  return {
    "registry/items/components/fixture-card/_registry.mdx": getRegistryMdx(),
    "registry/items/components/fixture-card/fixture-card.tsx": "export function FixtureCard() {}",
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
name: fixture-card
type: registry:ui
title: Fixture Card
description: A test card.${files}
---

Use this card in examples.

export function Preview() {
  return <div>Preview</div>
}
`;
}
