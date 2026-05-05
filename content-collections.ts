import { defineCollection, defineConfig, defineParser } from "@content-collections/core";
import { z } from "zod/v4";

import { parseDocsPageMetadataSource, parseDocsPageSource } from "./src/lib/docs/catalog-core.ts";
import { getDefaultRegistryTitle } from "./src/lib/registry/item-title.ts";
import {
  parseRegistryMdxDocument,
  parseRegistryMdxMetadataDocument,
  type ParsedRegistryMdx,
} from "./src/lib/registry/mdx.ts";

type SourceDocument = {
  _meta: {
    filePath: string;
  };
};

const sourceParser = defineParser((source) => ({ source }));
const sourceSchema = z.object({
  source: z.string(),
});
const registryMdxSchema = z
  .object({
    content: z.string(),
  })
  .catchall(z.unknown());

const authoredDocs = defineCollection({
  name: "authoredDocs",
  directory: "registry/docs",
  include: "**/*.{md,mdx}",
  parser: sourceParser,
  schema: sourceSchema,
  transform: (document, context) => {
    const page = parseDocsPageSource(getSourcePath("registry/docs", document), document.source);

    return page ?? context.skip("Draft docs page.");
  },
});

const docsNavigationItems = defineCollection({
  name: "docsNavigationItems",
  directory: "registry/docs",
  include: "**/*.{md,mdx}",
  parser: sourceParser,
  schema: sourceSchema,
  transform: (document, context) => {
    const page = parseDocsPageMetadataSource(
      getSourcePath("registry/docs", document),
      document.source,
    );

    return page ?? context.skip("Draft docs page.");
  },
});

const registryMdxItems = defineCollection({
  name: "registryMdxItems",
  directory: "registry/items",
  include: "**/_registry.mdx",
  schema: registryMdxSchema,
  transform: (document): ParsedRegistryMdx & { path: string } => {
    const path = getSourcePath("registry/items", document);
    const { content, _meta: _ignoredMeta, ...metadata } = document;

    return {
      path,
      ...parseRegistryMdxDocument(path, metadata, content),
    };
  },
});

const registryNavigationItems = defineCollection({
  name: "registryNavigationItems",
  directory: "registry/items",
  include: "**/_registry.mdx",
  schema: registryMdxSchema,
  transform: (document) => {
    const path = getSourcePath("registry/items", document);
    const { content: _content, _meta: _ignoredMeta, ...metadata } = document;
    const item = parseRegistryMdxMetadataDocument(path, metadata);

    return {
      name: item.name,
      type: item.type,
      title: item.title ?? getDefaultRegistryTitle(item.name),
      description: item.description ?? "",
    };
  },
});

const registryPreviews = defineCollection({
  name: "registryPreviews",
  directory: "registry/items",
  include: "**/_preview.tsx",
  parser: sourceParser,
  schema: sourceSchema,
  transform: (document) => ({
    path: getSourcePath("registry/items", document),
    source: document.source,
  }),
});

export default defineConfig({
  content: [
    authoredDocs,
    docsNavigationItems,
    registryMdxItems,
    registryNavigationItems,
    registryPreviews,
  ],
});

function getSourcePath(root: string, document: SourceDocument): string {
  return `${root}/${document._meta.filePath}`.replace(/\\/gu, "/");
}
