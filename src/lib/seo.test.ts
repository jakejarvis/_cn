import { describe, expect, test } from "vitest";

import {
  getCollectionPageJsonLd,
  getMarkdownAlternatePath,
  getMarkdownHttpLinkHeader,
  getPageTitle,
  getRobotsText,
  getSeoHead,
  getTechArticleJsonLd,
  getWebSiteJsonLd,
  shouldExcludeFromSitemap,
} from "@/lib/seo";
import { getCanonicalSiteUrl, siteConfig } from "@/lib/site-config";

describe("seo helpers", () => {
  test("formats page titles without duplicating the site name", () => {
    expect(getPageTitle(siteConfig.name)).toBe(siteConfig.name);
    expect(getPageTitle("Components")).toBe(`Components | ${siteConfig.name}`);
  });

  test("builds canonical, social, markdown, and JSON-LD head entries", () => {
    const pagePath = "/components/sample-item";
    const head = getSeoHead({
      title: "Sample Item",
      description: "A compact registry item.",
      path: pagePath,
      markdownPath: getMarkdownAlternatePath(pagePath),
      ogType: "article",
      jsonLd: [
        getTechArticleJsonLd({
          title: "Sample Item",
          description: "A compact registry item.",
          path: pagePath,
          section: "Components",
        }),
      ],
    });

    expect(head.meta).toContainEqual({ title: `Sample Item | ${siteConfig.name}` });
    expect(head.meta).toContainEqual({
      property: "og:url",
      content: getCanonicalSiteUrl(pagePath),
    });
    expect(head.meta).toContainEqual({
      property: "og:type",
      content: "article",
    });
    expect(head.scripts).toContainEqual({
      type: "application/ld+json",
      children: expect.stringContaining('"@type":"TechArticle"'),
    });
    expect(head.links).toContainEqual({
      rel: "canonical",
      href: getCanonicalSiteUrl(pagePath),
    });
    expect(head.links).toContainEqual({
      rel: "alternate",
      type: "text/markdown",
      href: getCanonicalSiteUrl(`${pagePath}.md`),
      title: `Sample Item | ${siteConfig.name} as Markdown`,
    });
  });

  test("builds site and collection JSON-LD", () => {
    expect(getWebSiteJsonLd()).toMatchObject({
      "@type": "WebSite",
      name: siteConfig.name,
      url: getCanonicalSiteUrl("/"),
    });

    expect(
      getCollectionPageJsonLd({
        title: "Components",
        description: "Reusable UI components.",
        path: "/components",
        items: [
          {
            title: "Sample Item",
            description: "A compact registry item.",
            path: "/components/sample-item",
          },
        ],
      }),
    ).toMatchObject({
      "@type": "CollectionPage",
      mainEntity: {
        "@type": "ItemList",
        itemListElement: [
          {
            position: 1,
            url: getCanonicalSiteUrl("/components/sample-item"),
          },
        ],
      },
    });
  });

  test("builds Markdown HTTP Link headers", () => {
    expect(getMarkdownHttpLinkHeader("/docs/getting-started")).toBe(
      `<${getCanonicalSiteUrl("/docs/getting-started")}>; rel="canonical", <${getCanonicalSiteUrl(
        "/docs/getting-started.md",
      )}>; rel="alternate"; type="text/markdown"`,
    );
  });

  test("marks machine-readable routes as sitemap-excluded", () => {
    expect(shouldExcludeFromSitemap("/components/sample-item.md")).toBe(true);
    expect(shouldExcludeFromSitemap("/registry.json")).toBe(true);
    expect(shouldExcludeFromSitemap("/llms.txt?cache=1")).toBe(true);
    expect(shouldExcludeFromSitemap("/robots.txt")).toBe(true);
    expect(shouldExcludeFromSitemap("/components/")).toBe(true);
    expect(shouldExcludeFromSitemap("/components/sample-item")).toBe(false);
  });

  test("builds robots text from the canonical site URL", () => {
    expect(getRobotsText()).toBe(
      ["User-agent: *", "Allow: /", "", `Sitemap: ${getCanonicalSiteUrl("/sitemap.xml")}`].join(
        "\n",
      ),
    );
  });
});
