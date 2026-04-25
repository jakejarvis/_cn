#!/usr/bin/env bun

import { join } from "node:path";

import { cancel, intro, isCancel, log, note, outro, select, text } from "@clack/prompts";

import {
  createRegistryScaffoldPlan,
  getDefaultRegistryScaffoldTitle,
  getRegistryScaffoldConflicts,
  registryScaffoldFileExtensions,
  registryScaffoldItemTypes,
  validateRegistryScaffoldName,
  type RegistryScaffoldFileExtension,
  type RegistryScaffoldInput,
  type RegistryScaffoldItemType,
  type RegistryScaffoldPlan,
} from "../src/lib/registry/scaffold";

const cliArgs = process.argv.slice(2);

if (cliArgs.some(isHelpArg)) {
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
  const options = parseOptions(rawArgs);
  const type = parseRegistryScaffoldItemType(options.type ?? "registry:ui");
  const name = requireOption(options.name, "--name");
  const description = requireOption(options.description, "--description");
  const title = options.title ?? getDefaultRegistryScaffoldTitle(name);
  const target = options.target;
  const fileExtension = options.fileExtension;
  const hasTarget = target !== undefined;
  const hasFileExtension = fileExtension !== undefined;

  if (hasTarget && type !== "registry:page" && type !== "registry:file") {
    throw new Error("--target is only supported for registry:page and registry:file items.");
  }

  if (hasFileExtension && type !== "registry:file") {
    throw new Error("--file-extension is only supported for registry:file items.");
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
  };
}

type CliOptionName = "description" | "fileExtension" | "name" | "target" | "title" | "type";

function parseOptions(rawArgs: string[]): Partial<Record<CliOptionName, string>> {
  const options: Partial<Record<CliOptionName, string>> = {};

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    const [flag, inlineValue] = arg.includes("=") ? arg.split(/=(.*)/su, 2) : [arg, undefined];

    if (!flag.startsWith("-")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const optionName = getCliOptionName(flag);

    if (!optionName) {
      throw new Error(`Unknown option: ${flag}`);
    }

    if (optionName in options) {
      throw new Error(`Duplicate option: ${flag}`);
    }

    const value = inlineValue ?? rawArgs[index + 1];

    if (value === undefined || (inlineValue === undefined && value.startsWith("-"))) {
      throw new Error(`Missing value for ${flag}`);
    }

    options[optionName] = value;

    if (inlineValue === undefined) {
      index += 1;
    }
  }

  return options;
}

function getCliOptionName(flag: string): CliOptionName | undefined {
  switch (flag) {
    case "--description":
      return "description";
    case "--file-extension":
      return "fileExtension";
    case "--name":
      return "name";
    case "--target":
      return "target";
    case "--title":
      return "title";
    case "--type":
      return "type";
    default:
      return undefined;
  }
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
  for (const fileExtension of registryScaffoldFileExtensions) {
    if (fileExtension === value) {
      return fileExtension;
    }
  }

  throw new Error(`Unsupported file extension: ${value}`);
}

function isHelpArg(arg: string): boolean {
  return arg === "--help" || arg === "-h";
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
  --file-extension <ext>        File extension for registry:file. Defaults to ts.
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
