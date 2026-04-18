import { describe, expect, test } from "vitest";

import {
  getAliasRegistryIndexPaths,
  getAliasRegistryItemPaths,
  getCanonicalRegistryIndexPath,
  getCanonicalRegistryItemPath,
} from "@/lib/site-config";

import { getInstallCommand } from "./install-command";

describe("install commands", () => {
  test("uses canonical flat registry item URLs", () => {
    expect(getInstallCommand("example-card", "npm")).toBe(
      "npx shadcn@latest add https://underscore-cn.vercel.app/example-card.json",
    );
  });

  test("builds registry paths from site config policy", () => {
    expect(getCanonicalRegistryIndexPath()).toBe("/registry.json");
    expect(getCanonicalRegistryItemPath("example-card")).toBe("/example-card.json");
    expect(getAliasRegistryIndexPaths()).toEqual(["/r/registry.json"]);
    expect(getAliasRegistryItemPaths("example-card")).toEqual(["/r/example-card.json"]);
  });

  test("switches command syntax by package manager", () => {
    expect(getInstallCommand("example-card", "pnpm")).toBe(
      "pnpm dlx shadcn@latest add https://underscore-cn.vercel.app/example-card.json",
    );
    expect(getInstallCommand("example-card", "yarn")).toBe(
      "yarn dlx shadcn@latest add https://underscore-cn.vercel.app/example-card.json",
    );
    expect(getInstallCommand("example-card", "bun")).toBe(
      "bunx --bun shadcn@latest add https://underscore-cn.vercel.app/example-card.json",
    );
  });
});
