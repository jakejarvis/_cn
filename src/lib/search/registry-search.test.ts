import { describe, expect, test } from "vitest";

import { getRegistrySectionsWithItems } from "@/lib/registry/sections";
import { getRegistrySearchRecords, searchRegistryItems } from "@/lib/search/registry-search";

describe("registry search", () => {
  test("builds search records for docs and every visible registry item", () => {
    const records = getRegistrySearchRecords();
    const sectionItems = getRegistrySectionsWithItems().flatMap((section) =>
      section.items.map((item) => ({
        name: item.name,
        section: section.id,
      })),
    );

    expect(records.map((record) => ({ name: record.name, section: record.section }))).toEqual([
      { name: "docs", section: "docs" },
      { name: "installation", section: "docs" },
      { name: "theming", section: "docs" },
      { name: "cli", section: "docs" },
      { name: "registry", section: "docs" },
      { name: "agent-skills", section: "docs" },
      { name: "llms", section: "docs" },
      { name: "changelog", section: "docs" },
      ...sectionItems,
    ]);
  });

  test("keeps registry metadata in search records", () => {
    const exampleCard = getRegistrySearchRecords().find((record) => record.name === "example-card");

    expect(exampleCard).toMatchObject({
      name: "example-card",
      title: "Example Card",
      section: "components",
      sectionTitle: "Components",
      type: "registry:ui",
      registryDependencies: ["badge", "button", "card"],
      fileNames: ["example-card.tsx"],
    });
  });

  test("returns the default catalog order for empty queries", async () => {
    const response = await searchRegistryItems({ query: "", limit: 10 });

    expect(response.results.map((result) => result.name)).toEqual([
      "docs",
      "installation",
      "theming",
      "cli",
      "registry",
      "agent-skills",
      "llms",
      "changelog",
      "example-card",
      "stats-panel",
    ]);
  });

  test("boosts title and name matches over dependency-only matches", async () => {
    const response = await searchRegistryItems({ query: "card", limit: 10 });

    expect(response.results.slice(0, 2).map((result) => result.name)).toEqual([
      "example-card",
      "stats-panel",
    ]);
  });

  test("returns typo-tolerant matches", async () => {
    const response = await searchRegistryItems({ query: "exampel", limit: 1 });

    expect(response.results[0]?.name).toBe("example-card");
  });

  test("returns docs matches with route paths", async () => {
    const response = await searchRegistryItems({ query: "installation", limit: 1 });

    expect(response.results[0]).toMatchObject({
      name: "installation",
      section: "docs",
      routePath: "/docs/installation",
      type: "docs",
    });
  });

  test("clamps the result limit", async () => {
    const response = await searchRegistryItems({ query: "card", limit: 1 });

    expect(response).toMatchObject({
      query: "card",
      count: 2,
      results: [
        {
          name: "example-card",
          section: "components",
        },
      ],
    });
  });
});
