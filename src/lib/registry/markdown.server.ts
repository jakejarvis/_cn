import {
  escapeMarkdownLinkText,
  formatCodeBlock,
  getMarkdownLanguage,
  joinMarkdownBlocks,
} from "@/lib/content/markdown";
import {
  createLinkedMarkdownResponse,
  createMarkdownNotFoundResponse,
} from "@/lib/content/responses.server";
import { getCanonicalDocsUrl, getCanonicalRegistryItemUrl } from "@/lib/site-config";

import { getRegistryItem } from "./catalog";
import type { RegistryDetailType } from "./detail.types";
import { getRegistryDisplaySource } from "./display-source.server";
import {
  registrySections,
  type RegistrySection,
  type RegistrySectionConfig,
} from "./section-config";
import { getRegistrySectionItems } from "./sections";
import { getRegistryItemWithSources, type RegistryCatalogItemWithSources } from "./source.server";

type RegistrySectionMarkdownConfig = Pick<
  RegistrySectionConfig,
  "basePath" | "description" | "title"
>;

type RegistrySectionMarkdownItem = Pick<
  RegistryCatalogItemWithSources,
  "description" | "name" | "title"
>;

type RegistryItemMarkdownItem = Pick<
  RegistryCatalogItemWithSources,
  "description" | "name" | "previewSourceFile" | "sourceFiles" | "title" | "usageSource"
>;

export function getRegistrySectionMarkdownResponse(section: RegistrySection): Response {
  const sectionConfig = registrySections[section];

  return createLinkedMarkdownResponse(getRegistrySectionMarkdown(section), sectionConfig.basePath);
}

export function getRegistryItemMarkdownResponse(
  section: RegistrySection,
  itemName: string,
): Response {
  const markdown = getRegistryItemMarkdown(section, itemName);

  if (!markdown) {
    return createMarkdownNotFoundResponse();
  }

  const sectionConfig = registrySections[section];

  return createLinkedMarkdownResponse(markdown, `${sectionConfig.basePath}/${itemName}`);
}

export function getRegistrySectionMarkdown(section: RegistrySection): string {
  const sectionConfig = registrySections[section];
  const items = getRegistrySectionItems(section);

  return createRegistrySectionMarkdown(sectionConfig, items);
}

export function createRegistrySectionMarkdown(
  sectionConfig: RegistrySectionMarkdownConfig,
  items: readonly RegistrySectionMarkdownItem[],
): string {
  const itemList = items
    .map(
      (item) =>
        `- [${escapeMarkdownLinkText(item.title)}](${getCanonicalDocsUrl(
          `${sectionConfig.basePath}/${item.name}`,
        )}): ${item.description}`,
    )
    .join("\n");

  return joinMarkdownBlocks([
    `# ${sectionConfig.title}`,
    sectionConfig.description,
    itemList || "No items are published in this section yet.",
  ]);
}

export function getRegistryItemMarkdown(section: RegistrySection, itemName: string): string | null {
  const sectionConfig = registrySections[section];
  const item = getRegistryItem(itemName);

  if (!item || !isExpectedRegistryType(item.type, sectionConfig.registryTypes)) {
    return null;
  }

  return createRegistryItemMarkdown(getRegistryItemWithSources(item));
}

export function createRegistryItemMarkdown(itemWithSources: RegistryItemMarkdownItem): string {
  const previewSource = getRegistryDisplaySource(
    itemWithSources,
    itemWithSources.previewSourceFile,
  );
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

  return joinMarkdownBlocks([
    `# ${itemWithSources.title}`,
    itemWithSources.description,
    "## Installation",
    formatCodeBlock(
      `npx shadcn@latest add ${getCanonicalRegistryItemUrl(itemWithSources.name)}`,
      "bash",
    ),
    `[Registry JSON](${getCanonicalRegistryItemUrl(itemWithSources.name)})`,
    "## Preview",
    formatCodeBlock(previewSource, "tsx"),
    "## Source",
    ...sourceBlocks,
    usageSource ? joinMarkdownBlocks(["## Usage", usageSource]) : "",
  ]);
}

function isExpectedRegistryType(
  type: string,
  expectedTypes: readonly RegistryDetailType[],
): type is RegistryDetailType {
  return expectedTypes.some((expectedType) => expectedType === type);
}
