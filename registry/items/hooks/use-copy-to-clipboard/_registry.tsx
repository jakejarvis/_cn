import { defineRegistryItem } from "@/lib/registry/metadata";

import { UseCopyToClipboardPreview } from "./_preview-client";

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
  return <UseCopyToClipboardPreview />;
}
