import { createFileRoute } from "@tanstack/react-router";

import { getRegistrySectionItemMarkdownResponse } from "../lib/registry/markdown.server";

export const Route = createFileRoute("/$section/{$name}.md")({
  server: {
    handlers: {
      GET: ({ params }) => getRegistrySectionItemMarkdownResponse(params.section, params.name),
    },
  },
});
