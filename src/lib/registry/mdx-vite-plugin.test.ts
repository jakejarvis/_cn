import { describe, expect, test } from "vitest";

import { mdxWithQueryBypass } from "./mdx-vite-plugin";

describe("MDX Vite plugin", () => {
  test("skips query string imports so Vite can handle raw and asset requests", async () => {
    const transform = mdxWithQueryBypass().transform;

    if (typeof transform !== "function") {
      throw new Error("Expected MDX plugin transform to be a function.");
    }

    expect(await transform("# hello", "/app/content.mdx?raw")).toBeUndefined();
    expect(await transform("# hello", "/app/content.mdx?url")).toBeUndefined();
    expect(await transform("# hello", "/app/content.mdx?v=123")).toBeUndefined();
  });
});
