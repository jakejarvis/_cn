import { createFileRoute } from "@tanstack/react-router";

import { getRegistryItemMarkdownResponse } from "../lib/registry/markdown.server";

export const Route = createFileRoute("/registry/{$name}.md")({
  server: {
    handlers: {
      GET: ({ params }) => getRegistryItemMarkdownResponse(params.name),
    },
  },
});
