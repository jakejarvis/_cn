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

describe("seo helpers", () => {
  test("formats page titles without duplicating the site name", () => {
    expect(getPageTitle("_cn")).toBe("_cn");
    expect(getPageTitle("Components")).toBe("Components | _cn");
  });

  test("builds canonical, social, markdown, and JSON-LD head entries", () => {
    const head = getSeoHead({
      title: "Example Card",
      description: "A compact card component.",
      path: "/components/example-card",
      markdownPath: getMarkdownAlternatePath("/components/example-card"),
      ogType: "article",
      jsonLd: [
        getTechArticleJsonLd({
          title: "Example Card",
          description: "A compact card component.",
          path: "/components/example-card",
          section: "Components",
        }),
      ],
    });

    expect(head.meta).toContainEqual({ title: "Example Card | _cn" });
    expect(head.meta).toContainEqual({
      property: "og:url",
      content: "https://underscore-cn.vercel.app/components/example-card",
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
      href: "https://underscore-cn.vercel.app/components/example-card",
    });
    expect(head.links).toContainEqual({
      rel: "alternate",
      type: "text/markdown",
      href: "https://underscore-cn.vercel.app/components/example-card.md",
      title: "Example Card | _cn as Markdown",
    });
  });

  test("builds site and collection JSON-LD", () => {
    expect(getWebSiteJsonLd()).toMatchObject({
      "@type": "WebSite",
      name: "_cn",
      url: "https://underscore-cn.vercel.app/",
    });

    expect(
      getCollectionPageJsonLd({
        title: "Components",
        description: "Reusable UI components.",
        path: "/components",
        items: [
          {
            title: "Example Card",
            description: "A compact card component.",
            path: "/components/example-card",
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
            url: "https://underscore-cn.vercel.app/components/example-card",
          },
        ],
      },
    });
  });

  test("builds Markdown HTTP Link headers", () => {
    expect(getMarkdownHttpLinkHeader("/docs/installation")).toBe(
      '<https://underscore-cn.vercel.app/docs/installation>; rel="canonical", <https://underscore-cn.vercel.app/docs/installation.md>; rel="alternate"; type="text/markdown"',
    );
  });

  test("marks machine-readable routes as sitemap-excluded", () => {
    expect(shouldExcludeFromSitemap("/components/example-card.md")).toBe(true);
    expect(shouldExcludeFromSitemap("/registry.json")).toBe(true);
    expect(shouldExcludeFromSitemap("/llms.txt?cache=1")).toBe(true);
    expect(shouldExcludeFromSitemap("/robots.txt")).toBe(true);
    expect(shouldExcludeFromSitemap("/components/")).toBe(true);
    expect(shouldExcludeFromSitemap("/components/example-card")).toBe(false);
  });

  test("builds robots text from the canonical site URL", () => {
    expect(getRobotsText()).toBe(
      "User-agent: *\nAllow: /\n\nSitemap: https://underscore-cn.vercel.app/sitemap.xml",
    );
  });
});
