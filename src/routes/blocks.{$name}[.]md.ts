import { createFileRoute } from "@tanstack/react-router";

import { getRegistryItemMarkdownResponse } from "@/lib/registry/docs-markdown.server";

export const Route = createFileRoute("/blocks/{$name}.md")({
  server: {
    handlers: {
      GET: ({ params }) => getRegistryItemMarkdownResponse("blocks", params.name),
    },
  },
});
