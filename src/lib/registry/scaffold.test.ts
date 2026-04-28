import { describe, expect, test } from "vitest";

import { getRegistryDiagnostics } from "./diagnostics";
import {
  createRegistryScaffoldPlan,
  getRegistryScaffoldConflicts,
  registryScaffoldItemTypes,
  validateRegistryScaffoldName,
  type RegistryScaffoldInput,
  type RegistryScaffoldItemType,
  type RegistryScaffoldPlan,
} from "./scaffold";

describe("registry scaffold", () => {
  test("plans each supported registry item type in the expected folder", () => {
    const expectedSourcePaths = new Map<RegistryScaffoldItemType, string | null>([
      ["registry:base", null],
      ["registry:block", "registry/items/blocks/example-item/example-item.tsx"],
      ["registry:component", "registry/items/components/example-item/example-item.tsx"],
      ["registry:font", null],
      ["registry:lib", "registry/items/lib/example-item/example-item.ts"],
      ["registry:hook", "registry/items/hooks/example-item/example-item.ts"],
      ["registry:ui", "registry/items/components/example-item/example-item.tsx"],
      ["registry:page", "registry/items/pages/example-item/page.tsx"],
      ["registry:file", "registry/items/files/example-item/example-item.ts"],
      ["registry:style", null],
      ["registry:theme", null],
      ["registry:item", null],
    ]);

    for (const type of registryScaffoldItemTypes) {
      const plan = createRegistryScaffoldPlan(getScaffoldInput({ type }));
      const expectedSourcePath = expectedSourcePaths.get(type);

      if (expectedSourcePath) {
        expect(plan.files.map((file) => file.path)).toContain(expectedSourcePath);
      } else {
        expect(plan.files).toHaveLength(1);
      }
      expect(plan.files.map((file) => file.path)).toContain(`${plan.itemRoot}/_registry.mdx`);
    }
  });

  test("omits explicit files for default registry ui items", () => {
    const plan = createRegistryScaffoldPlan(getScaffoldInput({ type: "registry:ui" }));

    expect(getRegistryMdx(plan)).not.toContain("files:");
  });

  test("includes explicit files for item types that need them", () => {
    for (const type of [
      "registry:block",
      "registry:component",
      "registry:hook",
      "registry:lib",
      "registry:page",
      "registry:file",
    ] as const) {
      const plan = createRegistryScaffoldPlan(getScaffoldInput({ type }));

      expect(getRegistryMdx(plan)).toContain("files:");
      expect(getRegistryMdx(plan)).toContain(`type: ${type}`);
    }
  });

  test("requires targets for page and file items", () => {
    expect(() =>
      createRegistryScaffoldPlan(getScaffoldInput({ type: "registry:page", target: "" })),
    ).toThrow(/requires an install target/u);
    expect(() =>
      createRegistryScaffoldPlan(getScaffoldInput({ type: "registry:file", target: "" })),
    ).toThrow(/requires an install target/u);
  });

  test("scaffolds targeted universal items with registry file targets", () => {
    const plan = createRegistryScaffoldPlan(
      getScaffoldInput({
        type: "registry:item",
        target: "~/.cursor/rules/example-item.mdc",
        fileExtension: "mdc",
      }),
    );

    expect(plan.files.map((file) => file.path)).toContain(
      "registry/items/items/example-item/example-item.mdc",
    );
    expect(getRegistryMdx(plan)).toContain("type: registry:file");
    expect(getRegistryMdx(plan)).toContain("target: ~/.cursor/rules/example-item.mdc");
  });

  test("requires font metadata for registry font items", () => {
    expect(() =>
      createRegistryScaffoldPlan({
        ...getScaffoldInput({ type: "registry:font" }),
        font: undefined,
      }),
    ).toThrow(/require font metadata/u);

    const plan = createRegistryScaffoldPlan(getScaffoldInput({ type: "registry:font" }));

    expect(getRegistryMdx(plan)).toContain("font:");
    expect(getRegistryMdx(plan)).toContain("provider: google");
  });

  test("rejects non-kebab-case names", () => {
    expect(validateRegistryScaffoldName("Example Item")).toMatch(/kebab-case/u);
    expect(() => createRegistryScaffoldPlan(getScaffoldInput({ name: "Example Item" }))).toThrow(
      /kebab-case/u,
    );
  });

  test("reports existing planned file conflicts", () => {
    const plan = createRegistryScaffoldPlan(getScaffoldInput());
    const registryMdx = plan.files[0];

    expect(getRegistryScaffoldConflicts(plan, [registryMdx.path])).toEqual([
      {
        path: registryMdx.path,
        message: `File already exists: ${registryMdx.path}`,
      },
    ]);
  });

  test("generated registry mdx parses through diagnostics", () => {
    for (const type of registryScaffoldItemTypes) {
      const plan = createRegistryScaffoldPlan(getScaffoldInput({ type }));
      const diagnostics = getRegistryDiagnostics({ files: getScaffoldFiles(plan) });

      expect(diagnostics.errors).toEqual([]);
    }
  });

  test("uses selected file extension for registry file items", () => {
    const plan = createRegistryScaffoldPlan(
      getScaffoldInput({ type: "registry:file", fileExtension: "css", target: "styles/item.css" }),
    );

    expect(plan.files.map((file) => file.path)).toContain(
      "registry/items/files/example-item/example-item.css",
    );
  });
});

function getScaffoldInput(input: Partial<RegistryScaffoldInput> = {}): RegistryScaffoldInput {
  const type = input.type ?? "registry:ui";

  return {
    type,
    name: input.name ?? "example-item",
    title: input.title ?? "Example Item",
    description: input.description ?? "A generated registry item.",
    ...(type === "registry:page" || type === "registry:file"
      ? { target: input.target ?? "app/example/page.tsx" }
      : {}),
    ...(input.fileExtension ? { fileExtension: input.fileExtension } : {}),
    ...(type === "registry:font"
      ? {
          font: input.font ?? {
            family: "'Inter Variable', sans-serif",
            import: "Inter",
            variable: "--font-sans",
          },
        }
      : {}),
    ...(type === "registry:item" && input.target ? { target: input.target } : {}),
  };
}

function getRegistryMdx(plan: RegistryScaffoldPlan): string {
  const registryMdx = plan.files.find((file) => file.path.endsWith("/_registry.mdx"));

  if (!registryMdx) {
    throw new Error("Expected registry mdx file.");
  }

  return registryMdx.content;
}

function getScaffoldFiles(plan: RegistryScaffoldPlan): Record<string, string> {
  return Object.fromEntries(plan.files.map((file) => [file.path, file.content]));
}
