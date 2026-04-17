"use client";

import { Button } from "@/components/ui/button";
import { defineRegistryItem } from "@/lib/registry/metadata";

import { useCopyToClipboard } from "./use-copy-to-clipboard";

const copyValue = "npx shadcn@latest add https://example.com/example-card.json";

export const registryItem = defineRegistryItem({
  name: "use-copy-to-clipboard",
  type: "registry:hook",
  title: "Use Copy To Clipboard",
  description: "A small hook that copies text and tracks the latest copy result.",
  files: [
    {
      path: "registry/items/hooks/use-copy-to-clipboard/use-copy-to-clipboard.ts",
      type: "registry:hook",
    },
  ],
});

export function Preview() {
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
