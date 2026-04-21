import { describe, expect, test } from "vitest";

import {
  getAliasRegistryIndexPaths,
  getAliasRegistryItemPaths,
  getCanonicalRegistryIndexPath,
  getCanonicalRegistryItemPath,
  getCanonicalRegistryItemUrl,
} from "@/lib/site-config";

import { getInstallCommand } from "./install-command";

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
});
