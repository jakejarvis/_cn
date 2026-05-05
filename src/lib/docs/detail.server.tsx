import {
  DocsCallout,
  renderMdxContentModule,
  type MdxContentModule,
  type RenderedMdxContent,
} from "@/components/docs/mdx-content.server";

import { normalizeGlobFiles } from "../glob";
import { getDocsPage, type DocsPage } from "./catalog";
import type { DocsPageDetailInput } from "./detail.types";
import type { DocsMdxComponentName } from "./mdx-components";

export type DocsPageDetail = Omit<DocsPage, "contentSource" | "keywords" | "sourcePath"> & {
  content: RenderedMdxContent | null;
};

const docsContentModules = import.meta.glob<MdxContentModule>("../../../registry/docs/*.{md,mdx}");
const docsContentModulesByPath = normalizeGlobFiles(docsContentModules);
const docsMdxComponents = {
  Callout: DocsCallout,
} satisfies Record<DocsMdxComponentName, unknown>;

export async function getDocsPageDetailData(data: DocsPageDetailInput) {
  const page = getDocsPage(data.path);

  if (!page) {
    return {
      path: data.path,
      page: null,
    };
  }

  return {
    path: data.path,
    page: await renderDocsPage(page),
  };
}

async function renderDocsPage(page: DocsPage): Promise<DocsPageDetail> {
  const { contentSource: _contentSource, keywords: _keywords, sourcePath, ...pageMetadata } = page;

  return {
    ...pageMetadata,
    content: await renderDocsContent(sourcePath),
  };
}

async function renderDocsContent(path: string): Promise<RenderedMdxContent | null> {
  const loadContent = docsContentModulesByPath[path];

  return renderMdxContentModule(loadContent, {
    components: docsMdxComponents,
  });
}
