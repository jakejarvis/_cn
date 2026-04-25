import { createCompositeComponent, type AnyCompositeComponent } from "@tanstack/react-start/rsc";
import * as React from "react";

import { renderMdxContent, type MdxContentModule } from "@/components/docs/mdx-content.server";

import { normalizeGlobFiles } from "../glob";
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

type RenderedUsage = Awaited<ReturnType<typeof renderUsage>>;
type RenderedPreview = Awaited<ReturnType<typeof renderPreview>>;
type RegistryPreviewModule = React.ComponentType;

const registryUsageModules = import.meta.glob<MdxContentModule>(
  "../../../registry/items/**/_registry.mdx",
  {
    query: "?registry-usage",
  },
);
const registryPreviewModules = import.meta.glob<RegistryPreviewModule>(
  "../../../registry/items/**/_registry.mdx",
  {
    import: "Preview",
    query: "?registry-preview",
  },
);

const registryUsageModulesByPath = normalizeGlobFiles(registryUsageModules);
const registryPreviewModulesByPath = normalizeGlobFiles(registryPreviewModules);

export type HighlightedRegistrySourceFile = RegistrySourceFileWithSource & {
  highlightedHtml: string;
};

export type HighlightedRegistryPreviewSourceFile = RegistryPreviewSourceFileWithSource & {
  highlightedHtml: string;
};

export type RegistryItemDetail = Omit<
  RegistryCatalogItemWithSources,
  "hasUsage" | "usageSource" | "previewSourceFile" | "sourceFiles"
> & {
  preview: RenderedPreview;
  previewSourceFile: HighlightedRegistryPreviewSourceFile;
  sourceFiles: HighlightedRegistrySourceFile[];
  usage?: RenderedUsage;
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
  const { hasUsage, usageSource: _usageSource, ...itemWithoutUsageFlag } = item;
  const [preview, previewSourceFile, sourceFiles, usage] = await Promise.all([
    renderPreview(item.previewSourceFile.path),
    highlightPreviewSourceFile(item, item.previewSourceFile),
    Promise.all(item.sourceFiles.map((file) => highlightSourceFile(item, file))),
    renderUsage(item.previewSourceFile.path, hasUsage),
  ]);

  return {
    ...itemWithoutUsageFlag,
    preview,
    previewSourceFile,
    sourceFiles,
    ...(usage ? { usage } : {}),
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
    highlightedHtml: await highlightCodeToHtml(source, "preview.tsx"),
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
    highlightedHtml: await highlightCodeToHtml(source, file.path),
  };
}

async function renderUsage(path: string, hasUsage: boolean) {
  if (!hasUsage) {
    return null;
  }

  const loadUsage = registryUsageModulesByPath[path];

  if (!loadUsage) {
    return null;
  }

  const Content = (await loadUsage()).default;

  return Content ? renderMdxContent({ Content }) : null;
}

async function renderPreview(path: string): Promise<AnyCompositeComponent | null> {
  const loadPreview = registryPreviewModulesByPath[path];

  if (!loadPreview) {
    return null;
  }

  const Preview = await loadPreview();

  return createCompositeComponent(() => (
    <div
      data-slot="component-preview"
      className="grid min-h-72 place-items-center rounded-lg border bg-background p-6"
    >
      <div data-slot="component-preview-stage" className="grid min-h-60 w-full place-items-center">
        <Preview />
      </div>
    </div>
  ));
}
