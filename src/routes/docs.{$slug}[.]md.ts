import { createFileRoute } from "@tanstack/react-router";

import { getAuthoredDocsPageMarkdownResponse } from "../lib/docs/markdown.server";

export const Route = createFileRoute("/docs/{$slug}.md")({
  server: {
    handlers: {
      GET: ({ params }) => getAuthoredDocsPageMarkdownResponse(params.slug),
    },
  },
});
