import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import type { RegistrySearchInput } from "./registry-search";

export const searchRegistryItemsFn = createServerFn({ method: "GET" })
  .inputValidator(validateRegistrySearchInput)
  .handler(async ({ data }) => {
    setResponseHeaders({
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=3600",
    });

    const { searchRegistryItems } = await import("./registry-search");

    return searchRegistryItems(data);
  });

function validateRegistrySearchInput(data: unknown): RegistrySearchInput {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("Expected registry search input.");
  }

  if (!("query" in data) || typeof data.query !== "string") {
    throw new Error("Expected a search query.");
  }

  const limit = "limit" in data ? data.limit : undefined;

  if (limit !== undefined && typeof limit !== "number") {
    throw new Error("Expected a numeric search limit.");
  }

  return { query: data.query, limit };
}
