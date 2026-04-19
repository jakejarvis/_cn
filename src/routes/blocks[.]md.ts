import { createFileRoute } from "@tanstack/react-router";

import { getRegistrySectionMarkdownResponse } from "@/lib/registry/docs-markdown.server";

export const Route = createFileRoute("/blocks.md")({
  server: {
    handlers: {
      GET: () => getRegistrySectionMarkdownResponse("blocks"),
    },
  },
});
