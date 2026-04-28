import { describe, expect, test } from "vitest";

import { docsPages } from "./docs/catalog";
import {
  createLlmsFullText,
  createLlmsText,
  getLlmsFullText,
  getLlmsFullTextResponse,
  getLlmsText,
  getLlmsTextResponse,
  type LlmsTextInput,
} from "./llms.server";
import { getRegistryCatalogWithItems } from "./registry/catalog";
import { registryCatalog } from "./registry/item-types";
import {
  getCanonicalRegistryIndexUrl,
  getCanonicalSiteUrl,
  getDocsMarkdownPath,
  siteConfig,
} from "./site-config";

const fixtureLlmsInput = {
  siteName: "Fixture Registry",
  siteDescription: "Fixture registry docs.",
  llmsTextUrl: "https://example.com/llms.txt",
  llmsFullTextUrl: "https://example.com/llms-full.txt",
  registryIndexUrl: "https://example.com/registry.json",
  sections: [
    {
      title: "Docs",
      documents: [
        {
          title: "Getting Started",
          url: "https://example.com/docs/getting-started.md",
          description: "Install the registry.",
          renderMarkdown: () => "# Getting Started\n\nInstall it.",
        },
      ],
    },
    {
      title: "Registry",
      documents: [
        {
          title: "Alpha Card",
          url: "https://example.com/registry/alpha-card.md",
          description: "A compact card.",
          renderMarkdown: () => "# Alpha Card\n\n## Installation",
        },
      ],
    },
  ],
} satisfies LlmsTextInput;

describe("llms text", () => {
  test("builds a site-level llms.txt index from supplied markdown routes", () => {
    const text = createLlmsText(fixtureLlmsInput);

    expect(text).toContain("# Fixture Registry");
    expect(text).toContain("> Fixture registry docs.");
    expect(text).toContain("https://example.com/llms-full.txt");
    expect(text).toContain(
      "- [Getting Started](https://example.com/docs/getting-started.md): Install the registry.",
    );
    expect(text).toContain(
      "- [Alpha Card](https://example.com/registry/alpha-card.md): A compact card.",
    );
    expect(text).toContain(
      "- [Registry JSON](https://example.com/registry.json): Machine-readable shadcn registry index.",
    );
  });

  test("builds a full context file from supplied markdown renderers", () => {
    const text = createLlmsFullText(fixtureLlmsInput);

    expect(text).toContain("# Fixture Registry Full Context");
    expect(text).toContain("URL: https://example.com/docs/getting-started.md");
    expect(text).toContain("# Getting Started");
    expect(text).toContain("URL: https://example.com/registry/alpha-card.md");
    expect(text).toContain("## Installation");
  });

  test("builds live llms.txt without requiring starter content", () => {
    const text = getLlmsText();

    expect(text).toContain(`# ${siteConfig.name}`);
    expect(text).toContain(`> ${siteConfig.description}`);
    expect(text).toContain(getCanonicalSiteUrl("/llms-full.txt"));
    expect(text).toContain(getCanonicalRegistryIndexUrl());

    for (const page of docsPages) {
      expect(text).toContain(getCanonicalSiteUrl(getDocsMarkdownPath(page.routePath)));
    }

    expect(text).toContain(getCanonicalSiteUrl(getDocsMarkdownPath(registryCatalog.basePath)));

    for (const item of getRegistryCatalogWithItems().items) {
      expect(text).toContain(
        getCanonicalSiteUrl(getDocsMarkdownPath(`${registryCatalog.basePath}/${item.name}`)),
      );
    }
  });

  test("builds live full context from generated markdown pages", () => {
    const text = getLlmsFullText();

    expect(text).toContain(`# ${siteConfig.name} Full Context`);
    expect(text).toContain(getCanonicalSiteUrl("/llms.txt"));
    expect(text).toContain(getCanonicalRegistryIndexUrl());
  });

  test("returns text responses with cache headers", async () => {
    const index = getLlmsTextResponse();
    const full = getLlmsFullTextResponse();

    expect(index.status).toBe(200);
    expect(index.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(index.headers.get("Link")).toBeNull();
    expect(await index.text()).toContain("/llms-full.txt");
    expect(full.status).toBe(200);
    expect(full.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(full.headers.get("Link")).toBeNull();
    expect(await full.text()).toContain("/llms.txt");
  });
});
