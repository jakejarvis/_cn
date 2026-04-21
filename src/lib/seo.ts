import { getCanonicalSiteUrl, getDocsMarkdownPath, siteConfig } from "./site-config.ts";

type JsonLdValue = string | number | boolean | null | JsonLdObject | readonly JsonLdValue[];

type JsonLdObject = {
  [key: string]: JsonLdValue | undefined;
};

type HeadMeta =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string };

type HeadLink = {
  rel: string;
  href: string;
  type?: string;
  title?: string;
};

type HeadScript = {
  type: "application/ld+json";
  children: string;
};

type SeoHead = {
  meta: HeadMeta[];
  links: HeadLink[];
  scripts: HeadScript[];
};

type SeoHeadOptions = {
  title: string;
  description: string;
  path: string;
  markdownPath?: string;
  ogType?: "article" | "website";
  jsonLd?: readonly JsonLdObject[];
};

type CollectionItem = {
  title: string;
  description: string;
  path: string;
};

const markdownContentType = "text/markdown";
const machineReadableRoutePattern = /\.(?:json|md|txt)$/u;

export function getPageTitle(title: string): string {
  const trimmedTitle = title.trim();

  if (!trimmedTitle || trimmedTitle === siteConfig.name) {
    return siteConfig.name;
  }

  return `${trimmedTitle} | ${siteConfig.name}`;
}

export function getSeoHead({
  title,
  description,
  path,
  markdownPath,
  ogType = "website",
  jsonLd = [],
}: SeoHeadOptions): SeoHead {
  const pageTitle = getPageTitle(title);
  const pageDescription = description.trim() || siteConfig.description;
  const canonicalUrl = getCanonicalSiteUrl(path);

  return {
    meta: [
      { title: pageTitle },
      { name: "description", content: pageDescription },
      { property: "og:title", content: pageTitle },
      { property: "og:description", content: pageDescription },
      { property: "og:site_name", content: siteConfig.name },
      { property: "og:type", content: ogType },
      { property: "og:url", content: canonicalUrl },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: pageTitle },
      { name: "twitter:description", content: pageDescription },
    ],
    links: [
      { rel: "canonical", href: canonicalUrl },
      ...(markdownPath
        ? [
            {
              rel: "alternate",
              type: markdownContentType,
              href: getCanonicalSiteUrl(markdownPath),
              title: `${pageTitle} as Markdown`,
            },
          ]
        : []),
    ],
    scripts: getJsonLdScripts(jsonLd),
  };
}

export function getJsonLdScripts(jsonLd: readonly JsonLdObject[]): HeadScript[] {
  return jsonLd.map((entry) => ({
    type: "application/ld+json",
    children: serializeJsonLd(entry),
  }));
}

export function getMarkdownAlternatePath(path: string): string {
  return getDocsMarkdownPath(path);
}

export function getWebSiteJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: getCanonicalSiteUrl("/"),
    description: siteConfig.description,
    publisher: getOrganizationJsonLd(),
  };
}

export function getTechArticleJsonLd({
  title,
  description,
  path,
  section,
}: {
  title: string;
  description: string;
  path: string;
  section?: string;
}): JsonLdObject {
  const canonicalUrl = getCanonicalSiteUrl(path);

  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: title,
    name: title,
    description: description.trim() || siteConfig.description,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    ...(section ? { articleSection: section } : {}),
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: getCanonicalSiteUrl("/"),
    },
    publisher: getOrganizationJsonLd(),
  };
}

export function getCollectionPageJsonLd({
  title,
  description,
  path,
  items,
}: {
  title: string;
  description: string;
  path: string;
  items: readonly CollectionItem[];
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description: description.trim() || siteConfig.description,
    url: getCanonicalSiteUrl(path),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: getCanonicalSiteUrl(item.path),
        item: {
          "@type": "CreativeWork",
          name: item.title,
          description: item.description,
          url: getCanonicalSiteUrl(item.path),
        },
      })),
    },
  };
}

export function getMarkdownHttpLinkHeader(pagePath: string): string {
  return formatHttpLinkHeader([
    {
      rel: "canonical",
      url: getCanonicalSiteUrl(pagePath),
    },
    {
      rel: "alternate",
      type: markdownContentType,
      url: getCanonicalSiteUrl(getMarkdownAlternatePath(pagePath)),
    },
  ]);
}

export function getLinkedHeaders(
  headers: Readonly<Record<string, string>>,
  linkHeader: string,
): Record<string, string> {
  return {
    ...headers,
    Link: linkHeader,
  };
}

export function shouldExcludeFromSitemap(path: string): boolean {
  const pathname = getPathname(path);

  return (
    machineReadableRoutePattern.test(pathname) ||
    isTrailingSlashDuplicate(pathname) ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/pages.json"
  );
}

function isTrailingSlashDuplicate(pathname: string): boolean {
  return pathname !== "/" && pathname.endsWith("/");
}

export function getRobotsText(): string {
  return ["User-agent: *", "Allow: /", "", `Sitemap: ${getCanonicalSiteUrl("/sitemap.xml")}`].join(
    "\n",
  );
}

function getOrganizationJsonLd(): JsonLdObject {
  return {
    "@type": "Organization",
    name: siteConfig.name,
    url: getCanonicalSiteUrl("/"),
    sameAs: [siteConfig.repositoryUrl],
  };
}

function formatHttpLinkHeader(
  links: readonly {
    rel: string;
    url: string;
    type?: string;
  }[],
): string {
  return links
    .map((link) => {
      const params = [`rel="${quoteHttpHeaderValue(link.rel)}"`];

      if (link.type) {
        params.push(`type="${quoteHttpHeaderValue(link.type)}"`);
      }

      return `<${link.url}>; ${params.join("; ")}`;
    })
    .join(", ");
}

function quoteHttpHeaderValue(value: string): string {
  return value.replace(/["\\]/gu, "\\$&");
}

function serializeJsonLd(jsonLd: JsonLdObject): string {
  return JSON.stringify(jsonLd).replace(/</gu, "\\u003c");
}

function getPathname(path: string): string {
  const pathWithoutQuery = path.split(/[?#]/u)[0] ?? "/";

  if (pathWithoutQuery.startsWith("http://") || pathWithoutQuery.startsWith("https://")) {
    return new URL(pathWithoutQuery).pathname || "/";
  }

  const normalizedPath = pathWithoutQuery.startsWith("/")
    ? pathWithoutQuery
    : `/${pathWithoutQuery}`;

  return normalizedPath || "/";
}
