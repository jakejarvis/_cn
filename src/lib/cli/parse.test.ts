import { describe, expect, test } from "vitest";

import { parseRegistryNewScriptCliArgs } from "./parse";

describe("parseRegistryNewScriptCliArgs", () => {
  test("values that start with `-` must use equals form (cac/mri does not bind the next argv token)", () => {
    expect(() =>
      parseRegistryNewScriptCliArgs([
        "--name",
        "x",
        "--description",
        "d",
        "--font-variable",
        "--font-sans",
      ]),
    ).toThrow(/Unknown option `--fontSans`/u);
  });

  test("requires a value when the next token is another flag", () => {
    expect(() =>
      parseRegistryNewScriptCliArgs([
        "--name",
        "x",
        "--description",
        "d",
        "--font-variable",
        "--target",
        "registry/page.tsx",
      ]),
    ).toThrow(/value is missing/u);
  });

  test("requires a value when the next token is inline flag=value form", () => {
    expect(() =>
      parseRegistryNewScriptCliArgs([
        "--name",
        "x",
        "--description",
        "d",
        "--font-variable",
        "--target=registry/page.tsx",
      ]),
    ).toThrow(/value is missing/u);
  });

  test("accepts --font-variable=--font-sans", () => {
    const parsed = parseRegistryNewScriptCliArgs([
      "--name",
      "x",
      "--description",
      "d",
      "--font-variable=--font-sans",
    ]);

    expect(parsed.fontVariable).toBe("--font-sans");
  });
});
