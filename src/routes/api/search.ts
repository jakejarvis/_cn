import { createFileRoute } from "@tanstack/react-router";

import { getRegistrySearchJsonResponse } from "@/lib/search/registry-search";

export const Route = createFileRoute("/api/search")({
  server: {
    handlers: {
      GET: ({ request }) => getRegistrySearchJsonResponse(request),
    },
  },
});
