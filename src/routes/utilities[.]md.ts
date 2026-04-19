import { createFileRoute } from "@tanstack/react-router";

import { getRegistrySectionMarkdownResponse } from "@/lib/registry/docs-markdown.server";

export const Route = createFileRoute("/utilities.md")({
  server: {
    handlers: {
      GET: () => getRegistrySectionMarkdownResponse("utilities"),
    },
  },
});
