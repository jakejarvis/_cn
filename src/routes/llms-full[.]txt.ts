import { createFileRoute } from "@tanstack/react-router";

import { getLlmsFullTextResponse } from "@/lib/llms.server";

export const Route = createFileRoute("/llms-full.txt")({
  server: {
    handlers: {
      GET: getLlmsFullTextResponse,
    },
  },
});
