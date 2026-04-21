import {
  escapeMarkdownLinkText,
  joinMarkdownBlocks,
  plainTextResponseHeaders,
} from "@/lib/content/markdown";
import { docsPages } from "@/lib/docs/catalog";
import { getAuthoredDocsPageMarkdown } from "@/lib/docs/markdown.server";
import {
  getRegistryItemMarkdown,
  getRegistrySectionMarkdown,
} from "@/lib/registry/markdown.server";
import { getRegistrySectionItems } from "@/lib/registry/section-items";
import { registrySectionList } from "@/lib/registry/sections";
import {
  getCanonicalRegistryIndexUrl,
  getCanonicalSiteUrl,
  getDocsMarkdownPath,
  siteConfig,
} from "@/lib/site-config";

export type LlmsDocument = {
  title: string;
  url: string;
  description: string;
  renderMarkdown: () => string;
};

export type LlmsSection = {
  title: string;
  documents: LlmsDocument[];
};

export type LlmsTextInput = {
  siteName: string;
  siteDescription: string;
  llmsTextUrl: string;
  llmsFullTextUrl: string;
  registryIndexUrl: string;
  sections: readonly LlmsSection[];
};

export function getLlmsTextResponse(): Response {
  return new Response(getLlmsText(), {
    headers: plainTextResponseHeaders,
  });
}

export function getLlmsFullTextResponse(): Response {
  return new Response(getLlmsFullText(), {
    headers: plainTextResponseHeaders,
  });
}

export function getLlmsText(): string {
  return createLlmsText(getDefaultLlmsTextInput());
}

export function getLlmsFullText(): string {
  return createLlmsFullText(getDefaultLlmsTextInput());
}

export function createLlmsText(input: LlmsTextInput): string {
  return joinMarkdownBlocks([
    `# ${input.siteName}`,
    `> ${input.siteDescription}`,
    [
      `This site publishes shadcn-compatible registry items and authored documentation for ${input.siteName}.`,
      `Use ${input.llmsFullTextUrl} for one expanded context file containing the linked Markdown pages.`,
    ].join(" "),
    ...input.sections.map(formatLlmsSection),
    formatLlmsSection({
      title: "Optional",
      documents: [
        {
          title: "Registry JSON",
          url: input.registryIndexUrl,
          description: "Machine-readable shadcn registry index.",
          renderMarkdown: () => "",
        },
      ],
    }),
  ]);
}

export function createLlmsFullText(input: LlmsTextInput): string {
  const documents = input.sections.flatMap((section) => section.documents);

  return joinMarkdownBlocks([
    `# ${input.siteName} Full Context`,
    `> ${input.siteDescription}`,
    [
      `This file expands the Markdown pages listed in ${input.llmsTextUrl}.`,
      `Use ${input.registryIndexUrl} for the machine-readable shadcn registry index.`,
    ].join(" "),
    ...documents.map(formatLlmsFullDocument),
  ]);
}

function getDefaultLlmsTextInput(): LlmsTextInput {
  return {
    siteName: siteConfig.name,
    siteDescription: siteConfig.description,
    llmsTextUrl: getCanonicalSiteUrl("/llms.txt"),
    llmsFullTextUrl: getCanonicalSiteUrl("/llms-full.txt"),
    registryIndexUrl: getCanonicalRegistryIndexUrl(),
    sections: getLlmsSections(),
  };
}

function getLlmsSections(): LlmsSection[] {
  return [
    {
      title: "Docs",
      documents: docsPages.map((page) => ({
        title: page.title,
        url: getCanonicalSiteUrl(getDocsMarkdownPath(page.routePath)),
        description: page.description || "Documentation page.",
        renderMarkdown: () => getAuthoredDocsPageMarkdown(page.slug) ?? "",
      })),
    },
    ...registrySectionList.map((section) => ({
      title: section.title,
      documents: [
        {
          title: `${section.title} index`,
          url: getCanonicalSiteUrl(getDocsMarkdownPath(section.basePath)),
          description: section.description,
          renderMarkdown: () => getRegistrySectionMarkdown(section.id),
        },
        ...getRegistrySectionItems(section.id).map((item) => ({
          title: item.title,
          url: getCanonicalSiteUrl(getDocsMarkdownPath(`${section.basePath}/${item.name}`)),
          description: item.description,
          renderMarkdown: () => getRegistryItemMarkdown(section.id, item.name) ?? "",
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
    document.renderMarkdown().trim(),
  ]);
}
