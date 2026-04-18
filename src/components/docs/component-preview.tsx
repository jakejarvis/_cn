"use client";

import type * as React from "react";

type PreviewModule = {
  Preview?: React.ComponentType;
};

const previewModules = import.meta.glob<PreviewModule>("../../../registry/items/**/_registry.mdx", {
  eager: true,
});

const previewByPath: Record<string, React.ComponentType | undefined> = {};

for (const [path, module] of Object.entries(previewModules)) {
  if (!module.Preview) {
    continue;
  }

  previewByPath[normalizeGlobPath(path)] = module.Preview;
}

type ComponentPreviewProps = {
  path: string;
};

export function ComponentPreview({ path }: ComponentPreviewProps) {
  const Preview = previewByPath[path];

  return (
    <div
      data-slot="component-preview"
      className="grid min-h-72 place-items-center rounded-lg border bg-background p-6"
    >
      {Preview ? (
        <div
          data-slot="component-preview-stage"
          className="grid min-h-60 w-full place-items-center"
        >
          <Preview />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No preview is available for this item.</p>
      )}
    </div>
  );
}

function normalizeGlobPath(path: string): string {
  return path.replace(/^(?:\.\.\/){3}/u, "");
}
