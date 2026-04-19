import {
  createCompositeComponent,
  renderServerComponent,
  type AnyCompositeComponent,
} from "@tanstack/react-start/rsc";
import * as React from "react";

import { CodeBlock } from "@/components/docs/code-block";
import { cn } from "@/lib/utils";

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
type RegistryMdxModule = {
  default?: React.ComponentType<{
    components?: Record<string, unknown>;
  }>;
};
type RegistryPreviewModule = React.ComponentType;

const registryMdxModules = import.meta.glob<RegistryMdxModule>(
  "../../../registry/items/**/_registry.mdx",
  {
    eager: true,
  },
);
const registryPreviewModules = import.meta.glob<RegistryPreviewModule>(
  "../../../registry/items/**/_registry.mdx",
  {
    import: "Preview",
    query: "?registry-preview",
  },
);

const registryMdxModulesByPath = normalizeGlobFiles(registryMdxModules);
const registryPreviewModulesByPath = normalizeGlobFiles(registryPreviewModules);
const usageMdxComponents = {
  a: MarkdownLink,
  code: MarkdownInlineCode,
  pre: MarkdownPre,
};

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

  const Content = registryMdxModulesByPath[path]?.default;

  return Content ? renderServerComponent(<UsageMdx Content={Content} />) : null;
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

function UsageMdx({ Content }: { Content: NonNullable<RegistryMdxModule["default"]> }) {
  return (
    <div className="prose max-w-none prose-neutral dark:prose-invert prose-pre:my-0">
      <Content components={usageMdxComponents} />
    </div>
  );
}

function MarkdownLink({ href, ...props }: React.ComponentProps<"a">) {
  const external = href?.startsWith("http://") || href?.startsWith("https://");

  return (
    <a {...props} href={href} {...(external ? { rel: "noreferrer", target: "_blank" } : {})} />
  );
}

function MarkdownInlineCode({ className, ...props }: React.ComponentProps<"code">) {
  return (
    <code
      className={cn("rounded bg-muted px-1 py-0.5 font-mono text-[0.875em] font-normal", className)}
      {...props}
    />
  );
}

async function MarkdownPre({ children }: React.ComponentProps<"pre">) {
  const child = React.Children.toArray(children).find(React.isValidElement);

  if (!React.isValidElement<CodeElementProps>(child)) {
    return <pre>{children}</pre>;
  }

  const code = getCodeText(child.props.children).replace(/\n$/u, "");
  const language = getMarkdownCodeLanguage(child.props.className);

  return (
    <CodeBlock
      code={code}
      highlightedHtml={await highlightCodeToHtml(code, language ?? "text")}
      className="not-prose my-4"
    />
  );
}

type CodeElementProps = {
  className?: string;
  children?: React.ReactNode;
};

function getMarkdownCodeLanguage(className: string | undefined): string | null {
  return className?.match(/(?:^|\s)language-([^\s]+)/u)?.[1] ?? null;
}

function getCodeText(children: React.ReactNode): string {
  return React.Children.toArray(children).map(getCodeChildText).join("");
}

function getCodeChildText(child: React.ReactNode): string {
  return typeof child === "string" || typeof child === "number" ? String(child) : "";
}

function normalizeGlobFiles<T>(files: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(files).map(([path, source]) => [normalizeGlobPath(path), source]),
  );
}

function normalizeGlobPath(path: string): string {
  return path.replace(/^(?:\.\.\/){3}/u, "");
}
