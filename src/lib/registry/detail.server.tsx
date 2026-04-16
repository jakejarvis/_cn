import { renderServerComponent } from "@tanstack/react-start/rsc";

import { getRegistryItem } from "./catalog";
import { isRegistryDetailType, type RegistryItemDetailInput } from "./detail.types";
import { getRegistryDisplaySource } from "./display-source.server";
import { highlightCodeToHtml } from "./highlight.server";
import {
  getRegistryItemWithSources,
  type RegistryCatalogItemWithSources,
  type RegistryPreviewSourceFileWithSource,
  type RegistrySourceFileWithSource,
} from "./source.server";

type HighlightedCodeRenderable = Awaited<ReturnType<typeof renderCode>>;

export type HighlightedRegistrySourceFile = RegistrySourceFileWithSource & {
  highlightedCode: HighlightedCodeRenderable;
};

export type HighlightedRegistryPreviewSourceFile = RegistryPreviewSourceFileWithSource & {
  highlightedCode: HighlightedCodeRenderable;
};

export type RegistryItemDetail = Omit<
  RegistryCatalogItemWithSources,
  "previewSourceFile" | "sourceFiles"
> & {
  previewSourceFile: HighlightedRegistryPreviewSourceFile;
  sourceFiles: HighlightedRegistrySourceFile[];
};

export async function getRegistryItemDetailData(data: RegistryItemDetailInput) {
  const item = getRegistryItem(data.name);

  if (!item || !isRegistryDetailType(item.type) || !data.expectedTypes.includes(item.type)) {
    return {
      name: data.name,
      item: null,
    };
  }

  return {
    name: data.name,
    item: await highlightRegistryItem(getRegistryItemWithSources(item)),
  };
}

async function highlightRegistryItem(
  item: RegistryCatalogItemWithSources,
): Promise<RegistryItemDetail> {
  const [previewSourceFile, sourceFiles] = await Promise.all([
    highlightPreviewSourceFile(item, item.previewSourceFile),
    Promise.all(item.sourceFiles.map((file) => highlightSourceFile(item, file))),
  ]);

  return {
    ...item,
    previewSourceFile,
    sourceFiles,
  };
}

async function highlightPreviewSourceFile(
  item: RegistryCatalogItemWithSources,
  file: RegistryPreviewSourceFileWithSource,
): Promise<HighlightedRegistryPreviewSourceFile> {
  const source = getRegistryDisplaySource(item, file);

  return {
    ...file,
    source,
    highlightedCode: await renderCode({ ...file, source }),
  };
}

async function highlightSourceFile(
  item: RegistryCatalogItemWithSources,
  file: RegistrySourceFileWithSource,
): Promise<HighlightedRegistrySourceFile> {
  const source = getRegistryDisplaySource(item, file);

  return {
    ...file,
    source,
    highlightedCode: await renderCode({ ...file, source }),
  };
}

async function renderCode(file: { path: string; source: string }) {
  const html = await highlightCodeToHtml(file.source, file.path);

  return renderServerComponent(<HighlightedCode html={html} />);
}

function HighlightedCode({ html }: { html: string }) {
  return <div className="contents" dangerouslySetInnerHTML={{ __html: html }} />;
}
