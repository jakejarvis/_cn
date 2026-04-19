import { createFileRoute } from "@tanstack/react-router";

import { getRegistryItemMarkdownResponse } from "@/lib/registry/docs-markdown.server";

export const Route = createFileRoute("/utilities/{$name}.md")({
  server: {
    handlers: {
      GET: ({ params }) => getRegistryItemMarkdownResponse("utilities", params.name),
    },
  },
});
