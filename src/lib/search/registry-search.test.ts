import { describe, expect, test } from "vitest";

import type { DocsPage } from "../docs/catalog";
import { docsPages } from "../docs/catalog";
import { getRegistryCatalogWithItems } from "../registry/catalog";
import { registryCatalog } from "../registry/item-types";
import {
  createRegistrySearchRecords,
  getRegistrySearchRecords,
  searchRegistryItems,
  searchRegistryRecords,
  type RegistrySearchRecordsInput,
} from "./registry-search";

const fixtureSearchInput = {
  docsPages: [
    createDocsPage({
      slug: "",
      title: "Docs",
      description: "Registry documentation.",
      keywords: "docs registry",
    }),
    createDocsPage({
      slug: "start",
      title: "Start Here",
      description: "Install the registry.",
      keywords: "setup guide",
    }),
  ],
  sections: [
    {
      id: "registry",
      title: "Registry",
      basePath: "/registry",
      items: [
        {
          name: "alpha-card",
          title: "Alpha Card",
          description: "A compact card component.",
          type: "registry:ui",
          registryDependencies: ["button"],
          files: [
            {
              path: "registry/items/components/alpha-card/alpha-card.tsx",
              type: "registry:ui",
            },
          ],
        },
        {
          name: "usage-panel",
          title: "Usage Panel",
          description: "A panel that composes the alpha card.",
          type: "registry:ui",
          registryDependencies: ["alpha-card"],
          files: [
            {
              path: "registry/items/components/usage-panel/usage-panel.tsx",
              type: "registry:ui",
            },
          ],
        },
      ],
    },
  ],
} satisfies RegistrySearchRecordsInput;

describe("registry search", () => {
  test("builds live search records from docs and the registry catalog", () => {
    expect(getRegistrySearchRecords()).toEqual(
      createRegistrySearchRecords({
        docsPages,
        sections: [
          {
            id: registryCatalog.id,
            title: registryCatalog.title,
            basePath: registryCatalog.basePath,
            items: getRegistryCatalogWithItems().items,
          },
        ],
      }),
    );
  });

  test("builds search records for supplied docs and registry items", () => {
    const records = createRegistrySearchRecords(fixtureSearchInput);

    expect(records.map((record) => ({ name: record.name, section: record.section }))).toEqual([
      { name: "docs", section: "docs" },
      { name: "start", section: "docs" },
      { name: "alpha-card", section: "registry" },
      { name: "usage-panel", section: "registry" },
    ]);
  });

  test("keeps registry metadata in search records", () => {
    const records = createRegistrySearchRecords(fixtureSearchInput);

    expect(records.find((record) => record.name === "alpha-card")).toMatchObject({
      name: "alpha-card",
      title: "Alpha Card",
      section: "registry",
      sectionTitle: "Registry",
      routePath: "/registry/alpha-card",
      type: "registry:ui",
      registryDependencies: ["button"],
      fileNames: ["alpha-card.tsx"],
    });
  });

  test("returns the supplied record order for empty queries", async () => {
    const records = createRegistrySearchRecords(fixtureSearchInput);
    const response = await searchRegistryRecords({ query: "", limit: 10 }, records);

    expect(response.results.map((result) => result.name)).toEqual(
      records.map((record) => record.name),
    );
  });

  test("boosts title and name matches over dependency-only matches", async () => {
    const records = createRegistrySearchRecords(fixtureSearchInput);
    const response = await searchRegistryRecords({ query: "card", limit: 10 }, records);

    expect(response.results[0]?.name).toBe("alpha-card");
  });

  test("returns typo-tolerant matches", async () => {
    const records = createRegistrySearchRecords(fixtureSearchInput);
    const response = await searchRegistryRecords({ query: "alpa", limit: 1 }, records);

    expect(response.results[0]?.name).toBe("alpha-card");
  });

  test("returns docs matches with route paths", async () => {
    const records = createRegistrySearchRecords(fixtureSearchInput);
    const response = await searchRegistryRecords({ query: "setup", limit: 1 }, records);

    expect(response.results[0]).toMatchObject({
      name: "start",
      section: "docs",
      routePath: "/docs/start",
      type: "docs",
    });
  });

  test("clamps the result limit", async () => {
    const records = createRegistrySearchRecords(fixtureSearchInput);
    const response = await searchRegistryRecords({ query: "card", limit: 1 }, records);

    expect(response).toMatchObject({
      query: "card",
      count: 2,
      results: [
        {
          name: "alpha-card",
          section: "registry",
        },
      ],
    });
  });

  test("searches live records without requiring starter content", async () => {
    const records = getRegistrySearchRecords();
    const response = await searchRegistryItems({ query: "", limit: records.length + 1 });

    expect(response.count).toBe(records.length);
    expect(response.results.map((result) => result.name)).toEqual(
      records.map((record) => record.name),
    );
  });
});

function createDocsPage({
  slug,
  title,
  description,
  keywords,
}: {
  slug: string;
  title: string;
  description: string;
  keywords: string;
}): DocsPage {
  return {
    sourcePath: slug ? `registry/docs/${slug}.mdx` : "registry/docs/index.mdx",
    slug,
    routePath: slug ? `/docs/${slug}` : "/docs",
    title,
    description,
    order: 0,
    contentSource: `# ${title}`,
    keywords,
  };
}
