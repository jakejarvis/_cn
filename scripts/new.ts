#!/usr/bin/env bun

import { join } from "node:path";

import { cancel, intro, isCancel, log, note, outro, select, text } from "@clack/prompts";

import {
  isRegistryNewScriptHelpArg,
  parseRegistryNewScriptCliArgs,
  type RegistryNewCliOptionName,
} from "../src/lib/cli/parse";
import {
  createRegistryScaffoldPlan,
  getDefaultRegistryScaffoldTitle,
  getRegistryScaffoldConflicts,
  registryScaffoldFileExtensions,
  registryScaffoldItemTypes,
  validateRegistryScaffoldFileExtension,
  validateRegistryScaffoldName,
  type RegistryScaffoldFileExtension,
  type RegistryScaffoldFontInput,
  type RegistryScaffoldInput,
  type RegistryScaffoldItemType,
  type RegistryScaffoldPlan,
} from "../src/lib/cli/scaffold";

const cliArgs = process.argv.slice(2);

if (cliArgs.some(isRegistryNewScriptHelpArg)) {
  printHelp();
  process.exit(0);
}

intro("Create registry item");

let input: RegistryScaffoldInput;
let scaffoldPlan: RegistryScaffoldPlan;

try {
  input =
    cliArgs.length > 0 ? parseRegistryScaffoldInput(cliArgs) : await promptRegistryScaffoldInput();
  scaffoldPlan = createRegistryScaffoldPlan(input);
} catch (error) {
  log.error(error instanceof Error ? error.message : "Failed to create registry item.");
  log.error("Run with --help for usage.");
  process.exit(1);
}

const rootExists = await pathExists(scaffoldPlan.itemRoot);
const existingScaffoldFiles = await getExistingScaffoldFiles(scaffoldPlan);
const conflicts = getRegistryScaffoldConflicts(scaffoldPlan, existingScaffoldFiles);

if (rootExists) {
  log.error(`Destination folder already exists: ${scaffoldPlan.itemRoot}`);
  process.exit(1);
}

if (conflicts.length > 0) {
  for (const conflict of conflicts) {
    log.error(conflict.message);
  }

  process.exit(1);
}

await writeRegistryScaffoldPlan(scaffoldPlan);

note(scaffoldPlan.files.map((file) => file.path).join("\n"), "Created files");
outro(`Created ${input.name}.`);

async function promptRegistryScaffoldInput(): Promise<RegistryScaffoldInput> {
  const type = await promptValue(
    select<RegistryScaffoldItemType>({
      message: "What type of registry item?",
      options: registryScaffoldItemTypes.map((value) => ({
        value,
        label: value,
      })),
      initialValue: "registry:ui",
    }),
  );
  const name = await promptValue(
    text({
      message: "Item name",
      placeholder: "example-card",
      validate: (value) => validateRegistryScaffoldName(value ?? ""),
    }),
  );
  const title = await promptValue(
    text({
      message: "Title",
      defaultValue: getDefaultRegistryScaffoldTitle(name),
      validate: (value) => (value?.trim() ? undefined : "Enter a title."),
    }),
  );
  const description = await promptValue(
    text({
      message: "Description",
      placeholder: "A short public description.",
      validate: (value) => (value?.trim() ? undefined : "Enter a description."),
    }),
  );
  const font = type === "registry:font" ? await promptRegistryScaffoldFontInput(name) : undefined;
  const fileExtension =
    type === "registry:file"
      ? await promptValue(
          select<RegistryScaffoldFileExtension>({
            message: "File extension",
            options: registryScaffoldFileExtensions.map((value) => ({
              value,
              label: value,
            })),
            initialValue: "ts",
          }),
        )
      : undefined;
  const target =
    type === "registry:page" || type === "registry:file"
      ? await promptValue(
          text({
            message: "Install target",
            placeholder:
              type === "registry:page"
                ? "app/example/page.tsx"
                : `lib/${name}.${fileExtension ?? "ts"}`,
            validate: (value) => (value?.trim() ? undefined : "Enter an install target."),
          }),
        )
      : undefined;

  return {
    type,
    name,
    title,
    description,
    ...(target ? { target } : {}),
    ...(fileExtension ? { fileExtension } : {}),
    ...(font ? { font } : {}),
  };
}

async function promptRegistryScaffoldFontInput(name: string): Promise<RegistryScaffoldFontInput> {
  const defaultImport = getDefaultRegistryScaffoldTitle(name.replace(/^font-/u, "")).replaceAll(
    " ",
    "_",
  );
  const family = await promptValue(
    text({
      message: "Font family",
      placeholder: "'Inter Variable', sans-serif",
      validate: (value) => (value?.trim() ? undefined : "Enter a font family."),
    }),
  );
  const importName = await promptValue(
    text({
      message: "Google font import",
      defaultValue: defaultImport,
      validate: (value) => (value?.trim() ? undefined : "Enter a font import name."),
    }),
  );
  const variable = await promptValue(
    text({
      message: "CSS variable",
      defaultValue: "--font-sans",
      validate: (value) => (value?.trim() ? undefined : "Enter a font CSS variable."),
    }),
  );

  return {
    family,
    import: importName,
    variable,
  };
}

async function promptValue<T>(prompt: Promise<T | symbol>): Promise<T> {
  const value = await prompt;

  if (isCancel(value)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return value;
}

function parseRegistryScaffoldInput(rawArgs: string[]): RegistryScaffoldInput {
  const options = parseRegistryNewScriptCliArgs(rawArgs);
  const type = parseRegistryScaffoldItemType(options.type ?? "registry:ui");
  const name = requireOption(options.name, "--name");
  const description = requireOption(options.description, "--description");
  const title = options.title ?? getDefaultRegistryScaffoldTitle(name);
  const target = options.target;
  const fileExtension = options.fileExtension;
  const hasTarget = target !== undefined;
  const hasFileExtension = fileExtension !== undefined;
  const font = parseRegistryScaffoldFontInput(options);

  if (hasTarget && !supportsTargetOption(type)) {
    throw new Error(
      "--target is only supported for registry:page, registry:file, and registry:item items.",
    );
  }

  if (hasFileExtension && !supportsFileExtensionOption(type, hasTarget)) {
    throw new Error(
      "--file-extension is only supported for registry:file items and targeted registry:item items.",
    );
  }

  if (font && type !== "registry:font") {
    throw new Error("Font options are only supported for registry:font items.");
  }

  return {
    type,
    name,
    title,
    description,
    ...(hasTarget ? { target } : {}),
    ...(hasFileExtension
      ? { fileExtension: parseRegistryScaffoldFileExtension(fileExtension) }
      : {}),
    ...(font ? { font } : {}),
  };
}

function parseRegistryScaffoldFontInput(
  options: Partial<Record<RegistryNewCliOptionName, string>>,
): RegistryScaffoldFontInput | undefined {
  const hasFontOptions = [
    options.fontFamily,
    options.fontImport,
    options.fontVariable,
    options.fontWeight,
    options.fontSubsets,
    options.fontSelector,
    options.fontDependency,
  ].some((value) => value !== undefined);

  if (!hasFontOptions) {
    return undefined;
  }

  const weight = parseCsvOption(options.fontWeight);
  const subsets = parseCsvOption(options.fontSubsets);

  return {
    family: requireOption(options.fontFamily, "--font-family"),
    import: requireOption(options.fontImport, "--font-import"),
    variable: requireOption(options.fontVariable, "--font-variable"),
    ...(weight ? { weight } : {}),
    ...(subsets ? { subsets } : {}),
    ...(options.fontSelector ? { selector: options.fontSelector } : {}),
    ...(options.fontDependency ? { dependency: options.fontDependency } : {}),
  };
}

function parseCsvOption(value: string | undefined): string[] | undefined {
  if (!value) {
    return undefined;
  }

  const values = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length > 0 ? values : undefined;
}

function requireOption(value: string | undefined, flag: string): string {
  if (value === undefined) {
    throw new Error(`Missing required option: ${flag}`);
  }

  return value;
}

function parseRegistryScaffoldItemType(value: string): RegistryScaffoldItemType {
  for (const itemType of registryScaffoldItemTypes) {
    if (itemType === value) {
      return itemType;
    }
  }

  throw new Error(`Unsupported registry item type: ${value}`);
}

function parseRegistryScaffoldFileExtension(value: string): RegistryScaffoldFileExtension {
  const error = validateRegistryScaffoldFileExtension(value);

  if (error) {
    throw new Error(error);
  }

  return value;
}

function supportsTargetOption(type: RegistryScaffoldItemType): boolean {
  return type === "registry:page" || type === "registry:file" || type === "registry:item";
}

function supportsFileExtensionOption(type: RegistryScaffoldItemType, hasTarget: boolean): boolean {
  return type === "registry:file" || (type === "registry:item" && hasTarget);
}

function printHelp(): void {
  process.stdout.write(`Create registry item

Usage:
  bun --bun ./scripts/new.ts
  bun --bun ./scripts/new.ts --type <type> --name <name> --description <description> [options]

Options:
  --type <type>                 Registry item type. Defaults to registry:ui.
  --name <name>                 Kebab-case registry item name.
  --title <title>               Public title. Defaults from name.
  --description <description>   Public description.
  --target <path>               Install target. Required for registry:page and registry:file.
                                Optional for registry:item universal files.
  --file-extension <ext>        File extension for registry:file and targeted registry:item. Defaults to ts.
  --font-family <family>        Font family for registry:font.
  --font-import <name>          Google font import name for registry:font.
  --font-variable <variable>    CSS variable for registry:font.
  --font-weight <weights>       Optional comma-separated font weights.
  --font-subsets <subsets>      Optional comma-separated font subsets.
  --font-selector <selector>    Optional selector for applying the font.
  --font-dependency <package>   Optional package for non-Next.js projects.
  -h, --help                    Show help.

Types:
  ${registryScaffoldItemTypes.join(", ")}

File extensions:
  ${registryScaffoldFileExtensions.join(", ")}
`);
}

async function getExistingScaffoldFiles(plan: RegistryScaffoldPlan): Promise<string[]> {
  const existingFilePaths = await Promise.all(
    plan.files.map(async (file) =>
      (await Bun.file(toWorkspacePath(file.path)).exists()) ? file.path : null,
    ),
  );

  return existingFilePaths.filter((path) => path !== null);
}

async function writeRegistryScaffoldPlan(plan: RegistryScaffoldPlan): Promise<void> {
  await Promise.all(plan.files.map(writeRegistryScaffoldFile));
}

async function writeRegistryScaffoldFile(
  file: RegistryScaffoldPlan["files"][number],
): Promise<void> {
  await Bun.write(toWorkspacePath(file.path), file.content);
}

async function pathExists(path: string): Promise<boolean> {
  const result = await Bun.$`test -e ${toWorkspacePath(path)}`.quiet().nothrow();

  return result.exitCode === 0;
}

function toWorkspacePath(path: string): string {
  return join(process.cwd(), path);
}
