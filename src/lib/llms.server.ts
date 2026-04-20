import { docsPages } from "@/lib/docs/catalog";
import { getAuthoredDocsPageMarkdown } from "@/lib/docs/markdown.server";
import {
  getRegistryItemMarkdown,
  getRegistrySectionMarkdown,
} from "@/lib/registry/markdown.server";
import { getRegistrySectionItems, registrySectionList } from "@/lib/registry/sections";
import {
  getCanonicalRegistryIndexUrl,
  getCanonicalSiteUrl,
  getDocsMarkdownPath,
  siteConfig,
} from "@/lib/site-config";

type LlmsDocument = {
  title: string;
  url: string;
  description: string;
  markdown: string;
};

type LlmsSection = {
  title: string;
  documents: LlmsDocument[];
};

export const llmsTextResponseHeaders = {
  "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
  "Content-Type": "text/plain; charset=utf-8",
} as const;

export function getLlmsTextResponse(): Response {
  return new Response(getLlmsText(), {
    headers: llmsTextResponseHeaders,
  });
}

export function getLlmsFullTextResponse(): Response {
  return new Response(getLlmsFullText(), {
    headers: llmsTextResponseHeaders,
  });
}

export function getLlmsText(): string {
  return joinMarkdownBlocks([
    `# ${siteConfig.name}`,
    `> ${siteConfig.description}`,
    [
      `This site publishes shadcn-compatible registry items and authored documentation for ${siteConfig.name}.`,
      `Use ${getCanonicalSiteUrl("/llms-full.txt")} for one expanded context file containing the linked Markdown pages.`,
    ].join(" "),
    ...getLlmsSections().map(formatLlmsSection),
    formatLlmsSection({
      title: "Optional",
      documents: [
        {
          title: "Registry JSON",
          url: getCanonicalRegistryIndexUrl(),
          description: "Machine-readable shadcn registry index.",
          markdown: "",
        },
      ],
    }),
  ]);
}

export function getLlmsFullText(): string {
  const documents = getLlmsSections().flatMap((section) => section.documents);

  return joinMarkdownBlocks([
    `# ${siteConfig.name} Full Context`,
    `> ${siteConfig.description}`,
    [
      `This file expands the Markdown pages listed in ${getCanonicalSiteUrl("/llms.txt")}.`,
      `Use ${getCanonicalRegistryIndexUrl()} for the machine-readable shadcn registry index.`,
    ].join(" "),
    ...documents.map(formatLlmsFullDocument),
  ]);
}

function getLlmsSections(): LlmsSection[] {
  return [
    {
      title: "Docs",
      documents: docsPages.map((page) => ({
        title: page.title,
        url: getCanonicalSiteUrl(getDocsMarkdownPath(page.routePath)),
        description: page.description || "Documentation page.",
        markdown: getAuthoredDocsPageMarkdown(page.slug) ?? "",
      })),
    },
    ...registrySectionList.map((section) => ({
      title: section.title,
      documents: [
        {
          title: `${section.title} index`,
          url: getCanonicalSiteUrl(getDocsMarkdownPath(section.basePath)),
          description: section.description,
          markdown: getRegistrySectionMarkdown(section.id),
        },
        ...getRegistrySectionItems(section.id).map((item) => ({
          title: item.title,
          url: getCanonicalSiteUrl(getDocsMarkdownPath(`${section.basePath}/${item.name}`)),
          description: item.description,
          markdown: getRegistryItemMarkdown(section.id, item.name) ?? "",
        })),
      ],
    })),
  ];
}

function formatLlmsSection(section: LlmsSection): string {
  const items = section.documents
    .map(
      (document) =>
        `- [${escapeMarkdownLinkText(document.title)}](${document.url}): ${
          document.description || "Markdown page."
        }`,
    )
    .join("\n");

  return joinMarkdownBlocks([`## ${section.title}`, items || "No pages are published yet."]);
}

function formatLlmsFullDocument(document: LlmsDocument): string {
  return joinMarkdownBlocks([
    "---",
    `URL: ${document.url}`,
    document.description,
    document.markdown.trim(),
  ]);
}

function joinMarkdownBlocks(blocks: string[]): string {
  return `${blocks.filter((block) => block.trim().length > 0).join("\n\n")}\n`;
}

function escapeMarkdownLinkText(value: string): string {
  return value.replace(/[[\]\\]/gu, "\\$&");
}
