import { createFileRoute } from "@tanstack/react-router";

import { getRegistryCatalogMarkdownResponse } from "../lib/registry/markdown.server";

export const Route = createFileRoute("/registry.md")({
  server: {
    handlers: {
      GET: () => getRegistryCatalogMarkdownResponse(),
    },
  },
});
