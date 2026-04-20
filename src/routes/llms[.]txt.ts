import { createFileRoute } from "@tanstack/react-router";

import { getLlmsTextResponse } from "@/lib/llms.server";

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: getLlmsTextResponse,
    },
  },
});
