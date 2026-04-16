"use client";

import { Button } from "@/components/ui/button";

import { useCopyToClipboard } from "./use-copy-to-clipboard";

const copyValue = "npx shadcn@latest add https://example.com/example-card.json";

export function UseCopyToClipboardPreview() {
  const copyState = useCopyToClipboard();

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Button onClick={() => void copyState.copy(copyValue)}>Copy example command</Button>
      <p className="text-sm text-muted-foreground">
        {copyState.status === "copied" ? "Copied to clipboard." : "Ready to copy."}
      </p>
    </div>
  );
}
