import {
  DocsCallout,
  renderMdxContent,
  type MdxContentModule,
} from "@/components/docs/mdx-content.server";

import { normalizeGlobFiles } from "../glob";
import { getDocsPage, type DocsPage } from "./catalog";
import type { DocsPageDetailInput } from "./detail.types";

type RenderedDocsContent = Awaited<ReturnType<typeof renderDocsContent>>;

export type DocsPageDetail = Omit<DocsPage, "contentSource" | "keywords" | "sourcePath"> & {
  content: RenderedDocsContent;
};

const docsContentModules = import.meta.glob<MdxContentModule>("../../../registry/docs/*.{md,mdx}");
const docsContentModulesByPath = normalizeGlobFiles(docsContentModules);

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

async function renderDocsContent(path: string) {
  const loadContent = docsContentModulesByPath[path];

  if (!loadContent) {
    return null;
  }

  const Content = (await loadContent()).default;

  return Content
    ? renderMdxContent({
        Content,
        components: {
          Callout: DocsCallout,
        },
      })
    : null;
}
