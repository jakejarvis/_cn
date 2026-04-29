import { cac } from "cac";

export type RegistryNewCliOptionName =
  | "description"
  | "fileExtension"
  | "fontDependency"
  | "fontFamily"
  | "fontImport"
  | "fontSelector"
  | "fontSubsets"
  | "fontVariable"
  | "fontWeight"
  | "name"
  | "target"
  | "title"
  | "type";

/** Options as `--name <flag>` strings for cac (angled brackets = value required when flag is used). */
const registryNewCliOptionSpecs = [
  "--description <description>",
  "--file-extension <fileExtension>",
  "--font-dependency <fontDependency>",
  "--font-family <fontFamily>",
  "--font-import <fontImport>",
  "--font-selector <fontSelector>",
  "--font-subsets <fontSubsets>",
  "--font-variable <fontVariable>",
  "--font-weight <fontWeight>",
  "--name <name>",
  "--target <target>",
  "--title <title>",
  "--type <type>",
] as const;

const registryNewArgvPrefix = ["node", "registry-new"] as const;

const registryNewCliOptionNames = [
  "description",
  "fileExtension",
  "fontDependency",
  "fontFamily",
  "fontImport",
  "fontSelector",
  "fontSubsets",
  "fontVariable",
  "fontWeight",
  "name",
  "target",
  "title",
  "type",
] as const satisfies readonly RegistryNewCliOptionName[];

export function isRegistryNewScriptHelpArg(arg: string): boolean {
  return arg === "--help" || arg === "-h";
}

export function parseRegistryNewScriptCliArgs(
  rawArgs: string[],
): Partial<Record<RegistryNewCliOptionName, string>> {
  assertNoDuplicateRegistryNewOptions(rawArgs);

  const cli = createRegistryNewCli();
  cli.parse([...registryNewArgvPrefix, ...rawArgs], { run: false });

  cli.globalCommand.checkUnknownOptions();
  cli.globalCommand.checkOptionValue();
  cli.globalCommand.checkUnusedArgs();

  return collectRegistryNewCliStringOptions(cli.options);
}

function createRegistryNewCli(): ReturnType<typeof cac> {
  const cli = cac("registry-new");

  for (const spec of registryNewCliOptionSpecs) {
    cli.option(spec, "");
  }

  return cli;
}

function assertNoDuplicateRegistryNewOptions(argv: readonly string[]): void {
  const seen = new Set<RegistryNewCliOptionName>();

  for (const arg of argv) {
    if (!arg.startsWith("-")) {
      continue;
    }

    const eq = arg.indexOf("=");
    const flagPart = eq === -1 ? arg : arg.slice(0, eq);
    const optionName = getRegistryNewCliOptionName(flagPart);

    if (!optionName) {
      continue;
    }

    if (seen.has(optionName)) {
      throw new Error(`Duplicate option: ${flagPart}`);
    }

    seen.add(optionName);
  }
}

function collectRegistryNewCliStringOptions(
  options: Record<string, unknown>,
): Partial<Record<RegistryNewCliOptionName, string>> {
  const result: Partial<Record<RegistryNewCliOptionName, string>> = {};

  for (const name of registryNewCliOptionNames) {
    const value = options[name];

    if (typeof value === "string") {
      result[name] = value;
    }
  }

  return result;
}

function getRegistryNewCliOptionName(flag: string): RegistryNewCliOptionName | undefined {
  switch (flag) {
    case "--description":
      return "description";
    case "--file-extension":
      return "fileExtension";
    case "--font-dependency":
      return "fontDependency";
    case "--font-family":
      return "fontFamily";
    case "--font-import":
      return "fontImport";
    case "--font-selector":
      return "fontSelector";
    case "--font-subsets":
      return "fontSubsets";
    case "--font-variable":
      return "fontVariable";
    case "--font-weight":
      return "fontWeight";
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
