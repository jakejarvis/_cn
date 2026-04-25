import { createFileRoute } from "@tanstack/react-router";

import { getAuthoredDocsPageMarkdownResponse } from "../lib/docs/markdown.server";

export const Route = createFileRoute("/docs.md")({
  server: {
    handlers: {
      GET: () => getAuthoredDocsPageMarkdownResponse(""),
    },
  },
});
