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

export function isRegistryNewScriptHelpArg(arg: string): boolean {
  return arg === "--help" || arg === "-h";
}

export function parseRegistryNewScriptCliArgs(
  rawArgs: string[],
): Partial<Record<RegistryNewCliOptionName, string>> {
  const options: Partial<Record<RegistryNewCliOptionName, string>> = {};

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    const [flag, inlineValue] = arg.includes("=") ? arg.split(/=(.*)/su, 2) : [arg, undefined];

    if (!flag.startsWith("-")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const optionName = getRegistryNewCliOptionName(flag);

    if (!optionName) {
      throw new Error(`Unknown option: ${flag}`);
    }

    if (optionName in options) {
      throw new Error(`Duplicate option: ${flag}`);
    }

    const value = inlineValue ?? rawArgs[index + 1];

    // Values may start with `--` (e.g. CSS variables like `--font-sans`). Only treat the next
    // token as "another flag" when it is a known option or help, not when it is free-form text.
    const nextTokenIsSeparateFlag =
      inlineValue === undefined &&
      value !== undefined &&
      value.startsWith("-") &&
      isCliFlagOrHelpToken(value);

    if (value === undefined || nextTokenIsSeparateFlag) {
      throw new Error(`Missing value for ${flag}`);
    }

    options[optionName] = value;

    if (inlineValue === undefined) {
      index += 1;
    }
  }

  return options;
}

function isCliFlagOrHelpToken(token: string): boolean {
  return isRegistryNewScriptHelpArg(token) || getRegistryNewCliOptionName(token) !== undefined;
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
