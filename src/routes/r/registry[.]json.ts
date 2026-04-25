import { createFileRoute } from "@tanstack/react-router";

import { getRegistryIndexJsonResponse } from "../../lib/registry/json.server";

export const Route = createFileRoute("/r/registry.json")({
  server: {
    handlers: {
      GET: getRegistryIndexJsonResponse,
    },
  },
});
