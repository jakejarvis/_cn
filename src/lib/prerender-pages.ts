import { readdirSync, readFileSync } from "node:fs";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";

import { parse as parseYaml } from "yaml";

import { parseRegistryMdxAst } from "./registry/mdx-ast.ts";
import { registrySectionList } from "./registry/section-config.ts";
import { shouldExcludeFromSitemap } from "./seo.ts";
import {
  getAliasRegistryIndexPaths,
  getAliasRegistryItemPaths,
  getCanonicalRegistryIndexPath,
  getCanonicalRegistryItemPath,
  getDocsMarkdownPath,
} from "./site-config.ts";

type PrerenderPage = {
  path: string;
  sitemap?: {
    exclude?: boolean;
  };
};

type RegistryPrerenderItem = {
  name: string;
  type: string;
};

const docsRoot = fileURLToPath(new URL("../../registry/docs", import.meta.url));
const registryItemsRoot = fileURLToPath(new URL("../../registry/items", import.meta.url));

export function getPrerenderPages(): PrerenderPage[] {
  const paths = new Set<string>();
  const addPath = (path: string) => {
    paths.add(normalizePagePath(path));
  };

  addPath("/");
  addPath(getCanonicalRegistryIndexPath());
  getAliasRegistryIndexPaths().forEach(addPath);
  addPath("/llms.txt");
  addPath("/llms-full.txt");
  addPath("/robots.txt");

  for (const section of registrySectionList) {
    addPath(section.basePath);
    addPath(getDocsMarkdownPath(section.basePath));
  }

  for (const docsPath of getDocsPagePaths()) {
    addPath(docsPath);
    addPath(getDocsMarkdownPath(docsPath));
  }

  for (const item of getRegistryPrerenderItems()) {
    addPath(getCanonicalRegistryItemPath(item.name));
    getAliasRegistryItemPaths(item.name).forEach(addPath);

    const section = registrySectionList.find((candidate) =>
      candidate.registryTypes.some((registryType) => registryType === item.type),
    );

    if (section) {
      const itemPath = `${section.basePath}/${item.name}`;

      addPath(itemPath);
      addPath(getDocsMarkdownPath(itemPath));
    }
  }

  return Array.from(paths, toPrerenderPage);
}

function toPrerenderPage(path: string): PrerenderPage {
  if (!shouldExcludeFromSitemap(path)) {
    return { path };
  }

  return {
    path,
    sitemap: {
      exclude: true,
    },
  };
}

function getDocsPagePaths(): string[] {
  return findFiles(docsRoot, (path) => /\.(?:md|mdx)$/u.test(path)).flatMap((path) => {
    const slug = getDocsSlugFromPath(path);

    return slug === null ? [] : [slug ? `/docs/${slug}` : "/docs"];
  });
}

function getDocsSlugFromPath(path: string): string | null {
  const relativePath = toPosixPath(relative(docsRoot, path));
  const segments = relativePath.replace(/\.(?:md|mdx)$/u, "").split("/");

  if (segments.some((segment) => !segment || segment.startsWith("_"))) {
    return null;
  }

  if (segments.length > 1) {
    throw new Error(`Nested docs pages are not supported yet: ${relativePath}`);
  }

  return segments[0] === "index" ? "" : segments[0];
}

function getRegistryPrerenderItems(): RegistryPrerenderItem[] {
  return findFiles(registryItemsRoot, (path) => path.endsWith("/_registry.mdx")).map((path) =>
    getRegistryPrerenderItem(path),
  );
}

function getRegistryPrerenderItem(path: string): RegistryPrerenderItem {
  const source = readFileSync(path, "utf8");
  const root = parseRegistryMdxAst(toPosixPath(relative(process.cwd(), path)), source);
  const frontmatter = root.children?.[0];

  if (frontmatter?.type !== "yaml") {
    throw new Error(`Registry item ${path} must start with YAML frontmatter.`);
  }

  const metadata = parseYaml(frontmatter.value ?? "");

  if (!isRegistryPrerenderItem(metadata)) {
    throw new Error(`Registry item ${path} must define string name and type frontmatter fields.`);
  }

  return {
    name: metadata.name,
    type: metadata.type,
  };
}

function isRegistryPrerenderItem(value: unknown): value is RegistryPrerenderItem {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "name" in value &&
    "type" in value &&
    typeof value.name === "string" &&
    typeof value.type === "string"
  );
}

function findFiles(root: string, predicate: (path: string) => boolean): string[] {
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => toPosixPath(`${entry.parentPath}/${entry.name}`))
    .filter(predicate)
    .toSorted();
}

function normalizePagePath(path: string): string {
  const trimmedPath = path.replace(/^\/+|\/+$/gu, "");

  return trimmedPath ? `/${trimmedPath}` : "/";
}

function toPosixPath(path: string): string {
  return path.replace(/\\/gu, "/");
}
