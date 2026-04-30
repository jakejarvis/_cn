import { create, insertMultiple, search as searchOrama } from "@orama/orama";
import type { Orama } from "@orama/orama";

import { docsPages, type DocsPage } from "../docs/catalog";
import { registryItems } from "../registry/catalog";
import type { RegistryCatalogItem } from "../registry/catalog-builder";
import { getRegistryTypeLabel } from "../registry/item-types";
import {
  getRegistryItemRoutePath,
  getRegistrySectionsWithItems,
  type RegistrySectionId,
} from "../registry/sections";

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
type SearchSection = "docs" | RegistrySectionId;

export type RegistrySearchItem = Pick<
  RegistryCatalogItem,
  "description" | "files" | "name" | "title" | "type"
> &
  Partial<Pick<RegistryCatalogItem, "categories" | "registryDependencies">>;

export type RegistrySearchSectionInput = {
  id: RegistrySectionId;
  title: string;
  basePath: string;
  items: readonly RegistrySearchItem[];
};

export type RegistrySearchRecordsInput = {
  docsPages: readonly DocsPage[];
  sections: readonly RegistrySearchSectionInput[];
};

export type RegistrySearchRecord = {
  id: string;
  name: string;
  title: string;
  description: string;
  section: SearchSection;
  sectionTitle: string;
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
  registrySearchRecordsCache ??= createRegistrySearchRecords(
    getDefaultRegistrySearchRecordsInput(),
  );

  return registrySearchRecordsCache;
}

export function createRegistrySearchRecords(
  input: RegistrySearchRecordsInput,
): RegistrySearchRecord[] {
  return [
    ...input.docsPages.map(toDocsSearchRecord),
    ...input.sections.flatMap((section) =>
      section.items.map((item) => toRegistrySearchRecord(section, item)),
    ),
  ];
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

export async function searchRegistryRecords(
  { query, limit = DEFAULT_SEARCH_LIMIT }: RegistrySearchInput,
  records: readonly RegistrySearchRecord[],
): Promise<RegistrySearchResponse> {
  const normalizedQuery = query.trim();
  const normalizedLimit = clampSearchLimit(limit);

  if (!normalizedQuery) {
    return {
      query: normalizedQuery,
      count: records.length,
      results: records.slice(0, normalizedLimit).map((record) => toRegistrySearchResult(record, 0)),
    };
  }

  const database = await createRegistrySearchDatabase(records);
  const recordMap = new Map(records.map((record) => [record.id, record]));
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
      const record = recordMap.get(hit.document.id);

      return record ? [toRegistrySearchResult(record, hit.score)] : [];
    }),
  };
}

function getRegistrySearchDatabase(): Promise<RegistrySearchDatabase> {
  registrySearchDatabasePromise ??= createRegistrySearchDatabase(getRegistrySearchRecords());

  return registrySearchDatabasePromise;
}

function getRegistrySearchRecordById(id: string): RegistrySearchRecord | undefined {
  registrySearchRecordMapCache ??= new Map(
    getRegistrySearchRecords().map((record) => [record.id, record]),
  );

  return registrySearchRecordMapCache.get(id);
}

async function createRegistrySearchDatabase(
  records: readonly RegistrySearchRecord[],
): Promise<RegistrySearchDatabase> {
  const database = create({
    schema: registrySearchSchema,
  });

  if (records.length > 0) {
    await insertMultiple(database, [...records]);
  }

  return database;
}

function toRegistrySearchRecord(
  section: RegistrySearchSectionInput,
  item: RegistrySearchItem,
): RegistrySearchRecord {
  const categories = item.categories?.map(String) ?? [];
  const registryDependencies = item.registryDependencies?.map(String) ?? [];
  const fileNames = item.files.map((file) => getFileName(file.path));
  const typeLabel = getRegistryTypeLabel(item.type);

  return {
    id: item.name,
    name: item.name,
    title: item.title,
    description: item.description,
    section: section.id,
    sectionTitle: section.title,
    routePath: getRegistryItemRoutePath(item),
    type: item.type,
    categories,
    registryDependencies,
    fileNames,
    keywords: getRegistrySearchKeywords({
      item,
      section,
      typeLabel,
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
  typeLabel,
  categories,
  registryDependencies,
  fileNames,
}: {
  item: RegistrySearchItem;
  section: RegistrySearchSectionInput;
  typeLabel: string;
  categories: string[];
  registryDependencies: string[];
  fileNames: string[];
}): string {
  return [
    item.name.replaceAll("-", " "),
    item.type.replace("registry:", ""),
    typeLabel,
    section.id,
    section.title,
    ...categories,
    ...registryDependencies.flatMap(getDependencyKeywords),
    ...fileNames.map((fileName) => fileName.replace(/\.[^.]+$/u, "")),
  ].join(" ");
}

function getDefaultRegistrySearchRecordsInput(): RegistrySearchRecordsInput {
  return {
    docsPages,
    sections: getRegistrySectionsWithItems(registryItems),
  };
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
