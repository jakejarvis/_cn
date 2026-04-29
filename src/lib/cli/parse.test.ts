import { describe, expect, test } from "vitest";

import { parseRegistryNewScriptCliArgs } from "./parse";

describe("parseRegistryNewScriptCliArgs", () => {
  test("treats a following token that looks like a CSS variable as the value, not a flag", () => {
    const parsed = parseRegistryNewScriptCliArgs([
      "--name",
      "x",
      "--description",
      "d",
      "--font-variable",
      "--font-sans",
    ]);

    expect(parsed.fontVariable).toBe("--font-sans");
  });

  test("still requires = or a value when the next token is a known CLI flag", () => {
    expect(() =>
      parseRegistryNewScriptCliArgs([
        "--name",
        "x",
        "--description",
        "d",
        "--font-variable",
        "--name",
        "y",
      ]),
    ).toThrow(/Missing value for --font-variable/u);
  });

  test("accepts --font-variable=--font-sans (inline form)", () => {
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
