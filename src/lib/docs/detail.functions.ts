import { createServerFn } from "@tanstack/react-start";

import type { DocsPageDetailInput } from "./detail.types";

export const getDocsPageDetail = createServerFn({ method: "GET" })
  .inputValidator(validateDocsPageDetailInput)
  .handler(async ({ data }) => {
    const { getDocsPageDetailData } = await import("./detail.server");

    return getDocsPageDetailData(data);
  });

function validateDocsPageDetailInput(data: unknown): DocsPageDetailInput {
  if (!isRecord(data)) {
    throw new Error("Expected docs page detail input.");
  }

  const { path } = data;

  if (typeof path !== "string") {
    throw new Error("Expected a docs page path.");
  }

  return { path };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
