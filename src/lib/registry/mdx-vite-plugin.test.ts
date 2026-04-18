import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { mdxWithQueryBypass } from "./mdx-vite-plugin";

describe("MDX Vite plugin", () => {
  test("skips raw and URL imports so Vite can handle source and asset requests", async () => {
    const transform = mdxWithQueryBypass().transform;

    if (typeof transform !== "function") {
      throw new Error("Expected MDX plugin transform to be a function.");
    }

    expect(await transform("# hello", "/app/content.mdx?raw")).toBeUndefined();
    expect(await transform("# hello", "/app/content.mdx?url")).toBeUndefined();
    expect(await transform("# hello", "/app/content.mdx?import&raw")).toBeUndefined();
  });

  test("transforms queried MDX module imports that are not asset requests", async () => {
    const transform = mdxWithQueryBypass().transform;

    if (typeof transform !== "function") {
      throw new Error("Expected MDX plugin transform to be a function.");
    }

    const result = await transform("# hello", "/app/content.mdx?preview");

    expect(result).toBeTruthy();
    expect(typeof result === "object" && "code" in result ? result.code : result).toContain(
      "hello",
    );
  });

  test("generates client preview modules from registry MDX ESM", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "registry-mdx-"));
    const path = join(tempDir, "_registry.mdx");

    try {
      await writeFile(
        path,
        `---
name: example
type: registry:ui
title: Example
description: Example.
---

import { Example } from "./example";

Usage content stays out of the preview module.

export function Preview() {
  return <Example />;
}
`,
      );

      const result = await mdxWithQueryBypass().load(`${path}?registry-preview`);
      const code = result?.code;

      expect(code).toContain('"use client";');
      expect(code).toContain('from "./example"');
      expect(code).toContain("function Preview");
      expect(code).not.toContain("Usage content");
    } finally {
      await rm(tempDir, { force: true, recursive: true });
    }
  });
});
