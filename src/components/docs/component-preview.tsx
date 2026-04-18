"use client";

import { CompositeComponent, type AnyCompositeComponent } from "@tanstack/react-start/rsc";

type ComponentPreviewProps = {
  preview: AnyCompositeComponent | null;
};

export function ComponentPreview({ preview }: ComponentPreviewProps) {
  if (preview) {
    return <CompositeComponent src={preview} />;
  }

  return (
    <div
      data-slot="component-preview"
      className="grid min-h-72 place-items-center rounded-lg border bg-background p-6"
    >
      <p className="text-sm text-muted-foreground">No preview is available for this item.</p>
    </div>
  );
}
