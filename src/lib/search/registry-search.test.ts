import { describe, expect, test } from "vitest";

import { getRegistrySectionsWithItems } from "@/lib/registry/sections";
import {
  getRegistrySearchJsonResponse,
  getRegistrySearchRecords,
  searchRegistryItems,
} from "@/lib/search/registry-search";

describe("registry search", () => {
  test("builds one search record for every visible registry item", () => {
    const records = getRegistrySearchRecords();
    const sectionItems = getRegistrySectionsWithItems().flatMap((section) =>
      section.items.map((item) => ({
        name: item.name,
        section: section.id,
      })),
    );

    expect(records.map((record) => ({ name: record.name, section: record.section }))).toEqual(
      sectionItems,
    );
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
      "example-card",
      "stats-panel",
      "use-copy-to-clipboard",
    ]);
  });

  test("boosts title and name matches over dependency-only matches", async () => {
    const response = await searchRegistryItems({ query: "card", limit: 10 });

    expect(response.results.map((result) => result.name)).toEqual(["example-card", "stats-panel"]);
  });

  test("returns typo-tolerant matches", async () => {
    const response = await searchRegistryItems({ query: "exampel", limit: 1 });

    expect(response.results[0]?.name).toBe("example-card");
  });

  test("serves search results as JSON and clamps the result limit", async () => {
    const response = await getRegistrySearchJsonResponse(
      new Request("https://example.com/api/search?q=card&limit=1"),
    );
    const body = await response.json();

    expect(body).toMatchObject({
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
