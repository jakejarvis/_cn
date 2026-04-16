import { createFileRoute } from "@tanstack/react-router";

import { getRegistryIndexJsonResponse } from "@/lib/registry/json.server";

export const Route = createFileRoute("/registry.json")({
  server: {
    handlers: {
      GET: getRegistryIndexJsonResponse,
    },
  },
});
