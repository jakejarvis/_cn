import { createFileRoute } from "@tanstack/react-router";

import { getRegistryItemJsonResponse } from "../../lib/registry/json.server";

export const Route = createFileRoute("/r/{$name}.json")({
  server: {
    handlers: {
      GET: ({ params }) => getRegistryItemJsonResponse(params.name),
    },
  },
});
