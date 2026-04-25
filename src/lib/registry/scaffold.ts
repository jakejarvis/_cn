export type RegistryScaffoldItemType =
  | "registry:ui"
  | "registry:component"
  | "registry:block"
  | "registry:hook"
  | "registry:lib"
  | "registry:page"
  | "registry:file";

export type RegistryScaffoldInput = {
  type: RegistryScaffoldItemType;
  name: string;
  title: string;
  description: string;
  target?: string;
  fileExtension?: RegistryScaffoldFileExtension;
};

export type RegistryScaffoldFile = {
  path: string;
  content: string;
};

export type RegistryScaffoldPlan = {
  itemRoot: string;
  files: RegistryScaffoldFile[];
};

export type RegistryScaffoldConflict = {
  path: string;
  message: string;
};

export type RegistryScaffoldFileExtension = "css" | "js" | "jsx" | "json" | "ts" | "tsx";

const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export const registryScaffoldItemTypes = [
  "registry:ui",
  "registry:component",
  "registry:block",
  "registry:hook",
  "registry:lib",
  "registry:page",
  "registry:file",
] as const satisfies readonly RegistryScaffoldItemType[];

export const registryScaffoldFileExtensions = [
  "ts",
  "tsx",
  "css",
  "json",
  "js",
  "jsx",
] as const satisfies readonly RegistryScaffoldFileExtension[];

export function createRegistryScaffoldPlan(input: RegistryScaffoldInput): RegistryScaffoldPlan {
  validateRegistryScaffoldInput(input);

  const itemRoot = getRegistryScaffoldItemRoot(input);
  const sourcePath = getRegistryScaffoldSourcePath(input, itemRoot);

  return {
    itemRoot,
    files: [
      {
        path: `${itemRoot}/_registry.mdx`,
        content: renderRegistryMdx(input, sourcePath),
      },
      {
        path: sourcePath,
        content: renderRegistrySource(input),
      },
    ],
  };
}

export function getRegistryScaffoldConflicts(
  plan: RegistryScaffoldPlan,
  existingPaths: readonly string[],
): RegistryScaffoldConflict[] {
  const existingPathSet = new Set(existingPaths.map(normalizePath));

  return plan.files.flatMap((file) =>
    existingPathSet.has(file.path)
      ? [
          {
            path: file.path,
            message: `File already exists: ${file.path}`,
          },
        ]
      : [],
  );
}

export function validateRegistryScaffoldName(name: string): string | undefined {
  if (!name.trim()) {
    return "Enter an item name.";
  }

  if (!kebabCasePattern.test(name)) {
    return "Use kebab-case with lowercase letters, numbers, and hyphens.";
  }

  return undefined;
}

export function getDefaultRegistryScaffoldTitle(name: string): string {
  return name
    .split("-")
    .map((segment) => `${segment.slice(0, 1).toUpperCase()}${segment.slice(1)}`)
    .join(" ");
}

function validateRegistryScaffoldInput(input: RegistryScaffoldInput): void {
  const nameError = validateRegistryScaffoldName(input.name);

  if (nameError) {
    throw new Error(nameError);
  }

  if (!input.title.trim()) {
    throw new Error("Registry item title is required.");
  }

  if (!input.description.trim()) {
    throw new Error("Registry item description is required.");
  }

  if ((input.type === "registry:page" || input.type === "registry:file") && !input.target?.trim()) {
    throw new Error(`Registry item type ${input.type} requires an install target.`);
  }

  if (input.type === "registry:file" && !getRegistryScaffoldFileExtension(input)) {
    throw new Error("Registry file item requires a supported file extension.");
  }
}

function getRegistryScaffoldItemRoot(input: Pick<RegistryScaffoldInput, "name" | "type">): string {
  return `registry/items/${getRegistryScaffoldSection(input.type)}/${input.name}`;
}

function getRegistryScaffoldSection(type: RegistryScaffoldItemType): string {
  switch (type) {
    case "registry:ui":
    case "registry:component":
      return "components";
    case "registry:block":
      return "blocks";
    case "registry:hook":
      return "hooks";
    case "registry:lib":
      return "lib";
    case "registry:page":
      return "pages";
    case "registry:file":
      return "files";
    default:
      return assertNever(type);
  }
}

function getRegistryScaffoldSourcePath(input: RegistryScaffoldInput, itemRoot: string): string {
  switch (input.type) {
    case "registry:hook":
    case "registry:lib":
      return `${itemRoot}/${input.name}.ts`;
    case "registry:page":
      return `${itemRoot}/page.tsx`;
    case "registry:file":
      return `${itemRoot}/${input.name}.${getRegistryScaffoldFileExtension(input)}`;
    case "registry:ui":
    case "registry:component":
    case "registry:block":
      return `${itemRoot}/${input.name}.tsx`;
    default:
      return assertNever(input.type);
  }
}

function getRegistryScaffoldFileExtension(
  input: Pick<RegistryScaffoldInput, "fileExtension">,
): RegistryScaffoldFileExtension {
  return input.fileExtension ?? "ts";
}

function renderRegistryMdx(input: RegistryScaffoldInput, sourcePath: string): string {
  return [
    renderRegistryFrontmatter(input, sourcePath),
    renderRegistryPreviewImport(input),
    input.description.trim(),
    "",
    renderRegistryUsageSnippet(input),
    "",
    renderRegistryPreview(input),
    "",
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function renderRegistryFrontmatter(input: RegistryScaffoldInput, sourcePath: string): string {
  const fields = [
    "---",
    `name: ${input.name}`,
    `type: ${input.type}`,
    `title: ${toYamlString(input.title)}`,
    `description: ${toYamlString(input.description)}`,
    ...getRegistryFrontmatterFiles(input, sourcePath),
    "---",
    "",
  ];

  return fields.join("\n");
}

function toYamlString(value: string): string {
  return JSON.stringify(value.trim());
}

function getRegistryFrontmatterFiles(input: RegistryScaffoldInput, sourcePath: string): string[] {
  if (input.type === "registry:ui") {
    return [];
  }

  const fileLines = ["files:", `  - path: ${sourcePath}`, `    type: ${input.type}`];

  if (input.target) {
    fileLines.push(`    target: ${input.target.trim()}`);
  }

  return fileLines;
}

function renderRegistryPreviewImport(input: RegistryScaffoldInput): string | null {
  const componentName = getRegistryScaffoldComponentName(input.name);
  const hookName = getRegistryScaffoldHookName(input.name);
  const helperName = getRegistryScaffoldHelperName(input.name);

  switch (input.type) {
    case "registry:ui":
    case "registry:component":
    case "registry:block":
      return `import { ${componentName} } from "./${input.name}";\n`;
    case "registry:hook":
      return `import { ${hookName} } from "./${input.name}";\n`;
    case "registry:lib":
      return `import { ${helperName} } from "./${input.name}";\n`;
    case "registry:page":
      return `import Page from "./page";\n`;
    case "registry:file":
      return null;
    default:
      return assertNever(input.type);
  }
}

function renderRegistryUsageSnippet(input: RegistryScaffoldInput): string {
  switch (input.type) {
    case "registry:ui":
      return [
        "```tsx",
        `import { ${getRegistryScaffoldComponentName(input.name)} } from "@/components/ui/${input.name}";`,
        "```",
      ].join("\n");
    case "registry:component":
    case "registry:block":
    case "registry:page":
    case "registry:file":
      return "";
    case "registry:hook":
      return [
        "```tsx",
        `import { ${getRegistryScaffoldHookName(input.name)} } from "@/hooks/${input.name}";`,
        "```",
      ].join("\n");
    case "registry:lib":
      return [
        "```ts",
        `import { ${getRegistryScaffoldHelperName(input.name)} } from "@/lib/${input.name}";`,
        "```",
      ].join("\n");
    default:
      return assertNever(input.type);
  }
}

function renderRegistryPreview(input: RegistryScaffoldInput): string {
  const componentName = getRegistryScaffoldComponentName(input.name);
  const hookName = getRegistryScaffoldHookName(input.name);
  const helperName = getRegistryScaffoldHelperName(input.name);

  switch (input.type) {
    case "registry:ui":
    case "registry:component":
    case "registry:block":
      return `export function Preview() {
  return <${componentName} />;
}`;
    case "registry:hook":
      return `export function Preview() {
  const state = ${hookName}();

  return <button onClick={state.toggle}>{state.enabled ? "Enabled" : "Disabled"}</button>;
}`;
    case "registry:lib":
      return `export function Preview() {
  return <pre>{${helperName}(${toTsString(input.title)})}</pre>;
}`;
    case "registry:page":
      return `export function Preview() {
  return <Page />;
}`;
    case "registry:file":
      return `export function Preview() {
  return <div>{${toTsString(input.title)}}</div>;
}`;
    default:
      return assertNever(input.type);
  }
}

function renderRegistrySource(input: RegistryScaffoldInput): string {
  switch (input.type) {
    case "registry:ui":
    case "registry:component":
    case "registry:block":
      return renderRegistryComponentSource(input);
    case "registry:hook":
      return renderRegistryHookSource(input);
    case "registry:lib":
      return renderRegistryLibSource(input);
    case "registry:page":
      return renderRegistryPageSource(input);
    case "registry:file":
      return renderRegistryFileSource(input);
    default:
      return assertNever(input.type);
  }
}

function renderRegistryComponentSource(input: RegistryScaffoldInput): string {
  const componentName = getRegistryScaffoldComponentName(input.name);

  return `export type ${componentName}Props = {
  title?: string;
  description?: string;
};

export function ${componentName}({
  title = ${toTsString(input.title)},
  description = ${toTsString(input.description)},
}: ${componentName}Props) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
`;
}

function renderRegistryHookSource(input: Pick<RegistryScaffoldInput, "name">): string {
  const hookName = getRegistryScaffoldHookName(input.name);

  return `"use client";

import { useCallback, useState } from "react";

export function ${hookName}(initialValue = false) {
  const [enabled, setEnabled] = useState(initialValue);
  const toggle = useCallback(() => setEnabled((value) => !value), []);

  return { enabled, setEnabled, toggle };
}
`;
}

function renderRegistryLibSource(input: Pick<RegistryScaffoldInput, "name">): string {
  const helperName = getRegistryScaffoldHelperName(input.name);

  return `export function ${helperName}(value: string): string {
  return value.trim();
}
`;
}

function renderRegistryPageSource(
  input: Pick<RegistryScaffoldInput, "description" | "title">,
): string {
  return `export default function Page() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-3 p-6">
      <h1 className="text-2xl font-semibold">{${toTsString(input.title)}}</h1>
      <p className="text-muted-foreground">{${toTsString(input.description)}}</p>
    </main>
  );
}
`;
}

function renderRegistryFileSource(input: RegistryScaffoldInput): string {
  const extension = getRegistryScaffoldFileExtension(input);
  const helperName = getRegistryScaffoldHelperName(input.name);
  const componentName = getRegistryScaffoldComponentName(input.name);

  switch (extension) {
    case "css":
      return `.${input.name} {
  display: block;
}
`;
    case "json":
      return `${JSON.stringify({ name: input.name, description: input.description.trim() }, null, 2)}\n`;
    case "js":
      return `export const ${helperName} = "${input.name}";
`;
    case "jsx":
      return `export function ${componentName}() {
  return <div>{${toTsString(input.title)}}</div>;
}
`;
    case "tsx":
      return `export function ${componentName}() {
  return <div>{${toTsString(input.title)}}</div>;
}
`;
    case "ts":
      return `export const ${helperName} = "${input.name}";
`;
    default:
      return assertNever(extension);
  }
}

function getRegistryScaffoldComponentName(name: string): string {
  return name
    .split("-")
    .map((segment) => `${segment.slice(0, 1).toUpperCase()}${segment.slice(1)}`)
    .join("");
}

function getRegistryScaffoldHookName(name: string): string {
  if (name.startsWith("use-")) {
    return getRegistryScaffoldHelperName(name);
  }

  return `use${getRegistryScaffoldComponentName(name)}`;
}

function getRegistryScaffoldHelperName(name: string): string {
  const componentName = getRegistryScaffoldComponentName(name);

  return `${componentName.slice(0, 1).toLowerCase()}${componentName.slice(1)}`;
}

function normalizePath(path: string): string {
  return path.replace(/\\/gu, "/").replace(/^\/+|\/+$/gu, "");
}

function toTsString(value: string): string {
  return JSON.stringify(value.trim());
}

function assertNever(value: never): never {
  throw new Error(`Unsupported registry scaffold value: ${String(value)}`);
}
