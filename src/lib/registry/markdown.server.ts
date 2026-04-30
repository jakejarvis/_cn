import {
  formatMarkdownLinkList,
  formatCodeBlock,
  getMarkdownLanguage,
  joinMarkdownBlocks,
} from "../content/markdown";
import {
  createLinkedMarkdownResponse,
  createMarkdownNotFoundResponse,
} from "../content/responses.server";
import { getCanonicalDocsUrl, getCanonicalRegistryItemUrl } from "../site-config";
import { getRegistryCatalogWithItems, getRegistryItem, registryItems } from "./catalog";
import type { RegistryCatalogItem } from "./catalog-builder";
import { getRegistryDisplaySource } from "./display-source.server";
import { registryCatalog } from "./item-types";
import {
  getRegistryItemRoutePath,
  getRegistrySectionItem,
  getRegistrySectionWithItems,
} from "./sections";
import { getRegistryItemWithSources, type RegistryCatalogItemWithSources } from "./source.server";

type RegistryCatalogMarkdownConfig = {
  basePath: string;
  description: string;
  title: string;
};

type RegistryCatalogMarkdownItem = Pick<RegistryCatalogItem, "description" | "name" | "title">;
type LinkedRegistryCatalogMarkdownItem = RegistryCatalogMarkdownItem & {
  routePath?: string;
};

type RegistryItemMarkdownItem = Pick<
  RegistryCatalogItemWithSources,
  | "description"
  | "hasPreview"
  | "name"
  | "previewSourceFile"
  | "sourceFiles"
  | "title"
  | "usageSource"
>;

export function getRegistryCatalogMarkdownResponse(): Response {
  return createLinkedMarkdownResponse(getRegistryCatalogMarkdown(), registryCatalog.basePath);
}

export function getRegistryItemMarkdownResponse(itemName: string): Response {
  const item = getRegistryItem(itemName);

  if (!item) {
    return createMarkdownNotFoundResponse();
  }

  return createLinkedMarkdownResponse(
    createRegistryItemMarkdown(getRegistryItemWithSources(item)),
    getRegistryItemRoutePath(item),
  );
}

export function getRegistrySectionMarkdownResponse(sectionId: string): Response {
  const markdown = getRegistrySectionMarkdown(sectionId);
  const section = getRegistrySectionWithItems(sectionId, registryItems);

  if (!markdown || !section) {
    return createMarkdownNotFoundResponse("Registry section not found.");
  }

  return createLinkedMarkdownResponse(markdown, section.basePath);
}

export function getRegistrySectionItemMarkdownResponse(
  sectionId: string,
  itemName: string,
): Response {
  const item = getRegistrySectionItem(sectionId, itemName, registryItems);

  if (!item) {
    return createMarkdownNotFoundResponse();
  }

  return createLinkedMarkdownResponse(
    createRegistryItemMarkdown(getRegistryItemWithSources(item)),
    getRegistryItemRoutePath(item),
  );
}

export function getRegistryCatalogMarkdown(): string {
  const catalog = getRegistryCatalogWithItems();

  return createRegistryCatalogMarkdown(
    catalog,
    catalog.items.map((item) => ({
      name: item.name,
      title: item.title,
      description: item.description,
      routePath: getRegistryItemRoutePath(item),
    })),
  );
}

export function getRegistrySectionMarkdown(sectionId: string): string | null {
  const section = getRegistrySectionWithItems(sectionId, registryItems);

  if (!section) {
    return null;
  }

  return createRegistryCatalogMarkdown(
    section,
    section.items.map((item) => ({
      name: item.name,
      title: item.title,
      description: item.description,
      routePath: getRegistryItemRoutePath(item),
    })),
  );
}

export function createRegistryCatalogMarkdown(
  catalog: RegistryCatalogMarkdownConfig,
  items: readonly LinkedRegistryCatalogMarkdownItem[],
): string {
  const itemList = formatMarkdownLinkList(
    items.map((item) => ({
      title: item.title,
      href: getCanonicalDocsUrl(item.routePath ?? `${catalog.basePath}/${item.name}`),
      description: item.description,
    })),
  );

  return joinMarkdownBlocks([
    `# ${catalog.title}`,
    catalog.description,
    itemList || "No items are published in the registry yet.",
  ]);
}

export function getRegistryItemMarkdown(itemName: string): string | null {
  const item = getRegistryItem(itemName);

  if (!item) {
    return null;
  }

  return createRegistryItemMarkdown(getRegistryItemWithSources(item));
}

export function createRegistryItemMarkdown(itemWithSources: RegistryItemMarkdownItem): string {
  const sourceBlocks = itemWithSources.sourceFiles.map((file) =>
    joinMarkdownBlocks([
      `### ${file.path}`,
      formatCodeBlock(
        getRegistryDisplaySource(itemWithSources, file),
        getMarkdownLanguage(file.path),
      ),
    ]),
  );
  const usageSource = itemWithSources.usageSource.trim();
  const previewSource = itemWithSources.hasPreview
    ? getRegistryDisplaySource(itemWithSources, itemWithSources.previewSourceFile)
    : "";

  return joinMarkdownBlocks([
    `# ${itemWithSources.title}`,
    itemWithSources.description,
    "## Installation",
    formatCodeBlock(
      `npx shadcn@latest add ${getCanonicalRegistryItemUrl(itemWithSources.name)}`,
      "bash",
    ),
    `[Registry JSON](${getCanonicalRegistryItemUrl(itemWithSources.name)})`,
    previewSource ? joinMarkdownBlocks(["## Preview", formatCodeBlock(previewSource, "tsx")]) : "",
    sourceBlocks.length > 0 ? joinMarkdownBlocks(["## Source", ...sourceBlocks]) : "",
    usageSource ? joinMarkdownBlocks(["## Usage", usageSource]) : "",
  ]);
}
