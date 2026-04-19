import { createFileRoute } from "@tanstack/react-router";

import { getRegistryItemMarkdownResponse } from "@/lib/registry/docs-markdown.server";

export const Route = createFileRoute("/components/{$name}.md")({
  server: {
    handlers: {
      GET: ({ params }) => getRegistryItemMarkdownResponse("components", params.name),
    },
  },
});
