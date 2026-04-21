import { create, insertMultiple, search as searchOrama } from "@orama/orama";
import type { Orama } from "@orama/orama";

import { docsPages, type DocsPage } from "@/lib/docs/catalog";
import type { RegistryCatalogItem } from "@/lib/registry/catalog";
import {
  registrySectionList,
  type RegistrySection,
  type RegistrySectionConfig,
} from "@/lib/registry/section-config";
import { getRegistrySectionItems } from "@/lib/registry/sections";

const DEFAULT_SEARCH_LIMIT = 20;
const MAX_SEARCH_LIMIT = 50;

const registrySearchSchema = {
  id: "string",
  name: "string",
  title: "string",
  description: "string",
  section: "enum",
  sectionTitle: "string",
  routePath: "string",
  type: "string",
  categories: "string[]",
  registryDependencies: "string[]",
  fileNames: "string[]",
  keywords: "string",
} as const;

const registrySearchProperties = [
  "title",
  "name",
  "description",
  "sectionTitle",
  "routePath",
  "type",
  "categories",
  "registryDependencies",
  "fileNames",
  "keywords",
] as const;

const registrySearchBoost = {
  title: 8,
  name: 6,
  description: 3,
  sectionTitle: 2,
  routePath: 1,
  categories: 2,
  registryDependencies: 1.5,
  fileNames: 1.5,
  type: 1,
  keywords: 1,
} satisfies Partial<Record<(typeof registrySearchProperties)[number], number>>;

type RegistrySearchDatabase = Orama<typeof registrySearchSchema>;
type SearchSection = RegistrySection | "docs";

export type RegistrySearchRecord = {
  id: string;
  name: string;
  title: string;
  description: string;
  section: SearchSection;
  sectionTitle: RegistrySectionConfig["title"] | "Docs";
  routePath: string;
  type: RegistryCatalogItem["type"] | "docs";
  categories: string[];
  registryDependencies: string[];
  fileNames: string[];
  keywords: string;
};

export type RegistrySearchResult = Omit<RegistrySearchRecord, "id" | "keywords"> & {
  score: number;
};

type RegistrySearchResponse = {
  query: string;
  count: number;
  results: RegistrySearchResult[];
};

export type RegistrySearchInput = {
  query: string;
  limit?: number;
};

let registrySearchDatabasePromise: Promise<RegistrySearchDatabase> | undefined;
let registrySearchRecordsCache: RegistrySearchRecord[] | undefined;
let registrySearchRecordMapCache: Map<string, RegistrySearchRecord> | undefined;

export function getRegistrySearchRecords(): RegistrySearchRecord[] {
  registrySearchRecordsCache ??= [
    ...docsPages.map(toDocsSearchRecord),
    ...registrySectionList.flatMap((section) =>
      getRegistrySectionItems(section.id).map((item) => toRegistrySearchRecord(section, item)),
    ),
  ];

  return registrySearchRecordsCache;
}

export async function searchRegistryItems({
  query,
  limit = DEFAULT_SEARCH_LIMIT,
}: RegistrySearchInput): Promise<RegistrySearchResponse> {
  const normalizedQuery = query.trim();
  const normalizedLimit = clampSearchLimit(limit);

  if (!normalizedQuery) {
    const records = getRegistrySearchRecords();

    return {
      query: normalizedQuery,
      count: records.length,
      results: records.slice(0, normalizedLimit).map((record) => toRegistrySearchResult(record, 0)),
    };
  }

  const database = await getRegistrySearchDatabase();
  const response = await searchOrama(database, {
    term: normalizedQuery,
    properties: [...registrySearchProperties],
    boost: registrySearchBoost,
    tolerance: getSearchTolerance(normalizedQuery),
    threshold: 0,
    limit: normalizedLimit,
  });

  return {
    query: normalizedQuery,
    count: response.count,
    results: response.hits.flatMap((hit) => {
      const record = getRegistrySearchRecordById(hit.document.id);

      return record ? [toRegistrySearchResult(record, hit.score)] : [];
    }),
  };
}

function getRegistrySearchDatabase(): Promise<RegistrySearchDatabase> {
  registrySearchDatabasePromise ??= createRegistrySearchDatabase();

  return registrySearchDatabasePromise;
}

function getRegistrySearchRecordById(id: string): RegistrySearchRecord | undefined {
  registrySearchRecordMapCache ??= new Map(
    getRegistrySearchRecords().map((record) => [record.id, record]),
  );

  return registrySearchRecordMapCache.get(id);
}

async function createRegistrySearchDatabase(): Promise<RegistrySearchDatabase> {
  const database = create({
    schema: registrySearchSchema,
  });

  await insertMultiple(database, getRegistrySearchRecords());

  return database;
}

function toRegistrySearchRecord(
  section: (typeof registrySectionList)[number],
  item: RegistryCatalogItem,
): RegistrySearchRecord {
  const categories = item.categories?.map(String) ?? [];
  const registryDependencies = item.registryDependencies?.map(String) ?? [];
  const fileNames = item.files.map((file) => getFileName(file.path));

  return {
    id: item.name,
    name: item.name,
    title: item.title,
    description: item.description,
    section: section.id,
    sectionTitle: section.title,
    routePath: `${section.basePath}/${item.name}`,
    type: item.type,
    categories,
    registryDependencies,
    fileNames,
    keywords: getRegistrySearchKeywords({
      item,
      section,
      categories,
      registryDependencies,
      fileNames,
    }),
  };
}

function toDocsSearchRecord(page: DocsPage): RegistrySearchRecord {
  const categories = page.group ? [page.group] : [];

  return {
    id: `docs:${page.slug || "index"}`,
    name: page.slug || "docs",
    title: page.title,
    description: page.description,
    section: "docs",
    sectionTitle: "Docs",
    routePath: page.routePath,
    type: "docs",
    categories,
    registryDependencies: [],
    fileNames: [getFileName(page.sourcePath)],
    keywords: page.keywords,
  };
}

function toRegistrySearchResult(record: RegistrySearchRecord, score: number): RegistrySearchResult {
  const { id: _id, keywords: _keywords, ...result } = record;

  return {
    ...result,
    score,
  };
}

function getRegistrySearchKeywords({
  item,
  section,
  categories,
  registryDependencies,
  fileNames,
}: {
  item: RegistryCatalogItem;
  section: (typeof registrySectionList)[number];
  categories: string[];
  registryDependencies: string[];
  fileNames: string[];
}): string {
  return [
    item.name.replaceAll("-", " "),
    item.type.replace("registry:", ""),
    section.id,
    section.title,
    ...categories,
    ...registryDependencies.flatMap(getDependencyKeywords),
    ...fileNames.map((fileName) => fileName.replace(/\.[^.]+$/u, "")),
  ].join(" ");
}

function getDependencyKeywords(dependency: string): string[] {
  const lastSegment = dependency.split("/").at(-1) ?? dependency;
  const itemName = lastSegment.replace(/\.json$/u, "");

  return [dependency, itemName, itemName.replaceAll("-", " ")];
}

function getFileName(path: string): string {
  return path.split("/").at(-1) ?? path;
}

function getSearchTolerance(query: string): number {
  return query.length >= 6 ? 2 : 1;
}

function clampSearchLimit(limit: number): number {
  if (!Number.isFinite(limit)) {
    return DEFAULT_SEARCH_LIMIT;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), MAX_SEARCH_LIMIT);
}
