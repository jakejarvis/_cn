import { createFileRoute } from "@tanstack/react-router";

import { getRobotsText } from "../lib/seo";

const robotsTextResponseHeaders = {
  "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
  "Content-Type": "text/plain; charset=utf-8",
} as const;

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(getRobotsText(), {
          headers: robotsTextResponseHeaders,
        }),
    },
  },
});
