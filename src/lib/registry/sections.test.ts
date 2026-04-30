import { describe, expect, test } from "vitest";

import { publicRegistryItemTypes } from "./item-types";
import {
  getRegistryItemRoutePath,
  getRegistrySectionIdForType,
  getRegistrySectionItem,
  getRegistrySectionsWithItems,
  registrySections,
} from "./sections";

const fixtureRegistryItems = [
  { name: "alpha-card", type: "registry:ui" },
  { name: "stats-grid", type: "registry:block" },
  { name: "use-clipboard", type: "registry:hook" },
] as const;

describe("registry sections", () => {
  test("maps every public registry type into a visible section", () => {
    expect(
      publicRegistryItemTypes.map((type) => [type, getRegistrySectionIdForType(type)]),
    ).toEqual([
      ["registry:base", "utilities"],
      ["registry:block", "blocks"],
      ["registry:component", "components"],
      ["registry:font", "utilities"],
      ["registry:lib", "utilities"],
      ["registry:hook", "utilities"],
      ["registry:ui", "components"],
      ["registry:page", "utilities"],
      ["registry:file", "utilities"],
      ["registry:style", "utilities"],
      ["registry:theme", "utilities"],
      ["registry:item", "utilities"],
    ]);
  });

  test("builds section route paths for registry items", () => {
    expect(getRegistryItemRoutePath({ name: "alpha", type: "registry:ui" })).toBe(
      "/components/alpha",
    );
    expect(getRegistryItemRoutePath({ name: "alpha", type: "registry:block" })).toBe(
      "/blocks/alpha",
    );
    expect(getRegistryItemRoutePath({ name: "alpha", type: "registry:hook" })).toBe(
      "/utilities/alpha",
    );
  });

  test("groups registry items into visible sections", () => {
    const sections = getRegistrySectionsWithItems(fixtureRegistryItems);

    expect(sections.map((section) => section.id)).toEqual(
      expect.arrayContaining(["components", "blocks", "utilities"]),
    );
    expect(
      sections.find((section) => section.id === "components")?.items.map(({ name }) => name),
    ).toContain("alpha-card");
    expect(
      sections.find((section) => section.id === "blocks")?.items.map(({ name }) => name),
    ).toContain("stats-grid");
    expect(
      sections.find((section) => section.id === "utilities")?.items.map(({ name }) => name),
    ).toContain("use-clipboard");
  });

  test("rejects wrong-section item lookups", () => {
    expect(
      getRegistrySectionItem(registrySections.components.id, "alpha-card", fixtureRegistryItems),
    ).toBeDefined();
    expect(
      getRegistrySectionItem(registrySections.blocks.id, "alpha-card", fixtureRegistryItems),
    ).toBeUndefined();
    expect(getRegistrySectionItem("missing", "alpha-card", fixtureRegistryItems)).toBeUndefined();
  });
});
