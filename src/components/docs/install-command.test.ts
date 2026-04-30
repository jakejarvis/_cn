import { describe, expect, test } from "vitest";

import {
  getAliasRegistryIndexPaths,
  getAliasRegistryItemPaths,
  getCanonicalRegistryIndexPath,
  getCanonicalRegistryItemPath,
  getCanonicalRegistryItemUrl,
} from "../../lib/site-config";
import {
  getInstallCommand,
  getPackageInstallCommand,
  getPackageInstallCommands,
} from "./install-command";

describe("install commands", () => {
  test("uses canonical registry item URLs", () => {
    expect(getInstallCommand("sample-item", "npm")).toBe(
      `npx shadcn@latest add ${getCanonicalRegistryItemUrl("sample-item")}`,
    );
  });

  test("builds registry paths from site config policy", () => {
    expect(getCanonicalRegistryIndexPath()).toBe("/registry.json");
    expect(getCanonicalRegistryItemPath("sample-item")).toBe("/r/sample-item.json");
    expect(getAliasRegistryIndexPaths()).toEqual(["/r/registry.json"]);
    expect(getAliasRegistryItemPaths("sample-item")).toEqual([]);
  });

  test("switches command syntax by package manager", () => {
    expect(getInstallCommand("sample-item", "pnpm")).toBe(
      `pnpm dlx shadcn@latest add ${getCanonicalRegistryItemUrl("sample-item")}`,
    );
    expect(getInstallCommand("sample-item", "yarn")).toBe(
      `yarn dlx shadcn@latest add ${getCanonicalRegistryItemUrl("sample-item")}`,
    );
    expect(getInstallCommand("sample-item", "bun")).toBe(
      `bunx --bun shadcn@latest add ${getCanonicalRegistryItemUrl("sample-item")}`,
    );
  });

  test("builds package install commands by package manager", () => {
    const packages = ["radix-ui", "lucide-react"];

    expect(getPackageInstallCommand(packages, "npm")).toBe("npm install radix-ui lucide-react");
    expect(getPackageInstallCommand(packages, "pnpm")).toBe("pnpm add radix-ui lucide-react");
    expect(getPackageInstallCommand(packages, "yarn")).toBe("yarn add radix-ui lucide-react");
    expect(getPackageInstallCommand(packages, "bun")).toBe("bun add radix-ui lucide-react");
  });

  test("builds dev dependency install commands", () => {
    const packages = ["@types/react"];

    expect(getPackageInstallCommand(packages, "npm", { dev: true })).toBe(
      "npm install -D @types/react",
    );
    expect(getPackageInstallCommand(packages, "pnpm", { dev: true })).toBe(
      "pnpm add -D @types/react",
    );
    expect(getPackageInstallCommand(packages, "yarn", { dev: true })).toBe(
      "yarn add -D @types/react",
    );
    expect(getPackageInstallCommand(packages, "bun", { dev: true })).toBe(
      "bun add -d @types/react",
    );
  });

  test("omits empty package install commands", () => {
    expect(getPackageInstallCommand([], "npm")).toBe("");
    expect(getPackageInstallCommands({}, "npm")).toEqual([]);
  });

  test("returns separate dependency and dev dependency commands", () => {
    expect(
      getPackageInstallCommands(
        {
          dependencies: ["radix-ui"],
          devDependencies: ["tailwindcss"],
        },
        "npm",
      ),
    ).toEqual(["npm install radix-ui", "npm install -D tailwindcss"]);
  });
});
