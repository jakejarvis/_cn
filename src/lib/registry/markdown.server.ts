import { getLinkedHeaders, getMarkdownHttpLinkHeader } from "@/lib/seo";
import { getCanonicalDocsUrl, getCanonicalRegistryItemUrl } from "@/lib/site-config";

import { getRegistryItem } from "./catalog";
import type { RegistryDetailType } from "./detail.types";
import { getRegistryDisplaySource } from "./display-source.server";
import { registrySections, type RegistrySection } from "./section-config";
import { getRegistrySectionItems } from "./sections";
import { getRegistryItemWithSources } from "./source.server";

const docsMarkdownResponseHeaders = {
  "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
  "Content-Type": "text/markdown; charset=utf-8",
} as const;

export function getRegistrySectionMarkdownResponse(section: RegistrySection): Response {
  const sectionConfig = registrySections[section];

  return new Response(getRegistrySectionMarkdown(section), {
    headers: getLinkedHeaders(
      docsMarkdownResponseHeaders,
      getMarkdownHttpLinkHeader(sectionConfig.basePath),
    ),
  });
}

export function getRegistryItemMarkdownResponse(
  section: RegistrySection,
  itemName: string,
): Response {
  const markdown = getRegistryItemMarkdown(section, itemName);

  if (!markdown) {
    return new Response("Docs page not found.", {
      headers: docsMarkdownResponseHeaders,
      status: 404,
    });
  }

  const sectionConfig = registrySections[section];

  return new Response(markdown, {
    headers: getLinkedHeaders(
      docsMarkdownResponseHeaders,
      getMarkdownHttpLinkHeader(`${sectionConfig.basePath}/${itemName}`),
    ),
  });
}

export function getRegistrySectionMarkdown(section: RegistrySection): string {
  const sectionConfig = registrySections[section];
  const items = getRegistrySectionItems(section);
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

  const itemWithSources = getRegistryItemWithSources(item);
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
    `# ${item.title}`,
    item.description,
    "## Installation",
    formatCodeBlock(`npx shadcn@latest add ${getCanonicalRegistryItemUrl(item.name)}`, "bash"),
    `[Registry JSON](${getCanonicalRegistryItemUrl(item.name)})`,
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

function formatCodeBlock(code: string, language: string): string {
  const fence = getCodeFence(code);

  return `${fence}${language}\n${code}\n${fence}`;
}

function getCodeFence(code: string): string {
  const backtickRuns = code.match(/`+/gu) ?? [];
  const longestRunLength = Math.max(0, ...backtickRuns.map((run) => run.length));

  return "`".repeat(Math.max(3, longestRunLength + 1));
}

function getMarkdownLanguage(path: string): string {
  const extension = path.split(".").at(-1);

  switch (extension) {
    case "tsx":
    case "ts":
    case "jsx":
    case "js":
    case "css":
    case "json":
      return extension;
    default:
      return "text";
  }
}

function joinMarkdownBlocks(blocks: string[]): string {
  return `${blocks.filter((block) => block.trim().length > 0).join("\n\n")}\n`;
}

function escapeMarkdownLinkText(value: string): string {
  return value.replace(/[[\]\\]/gu, "\\$&");
}
