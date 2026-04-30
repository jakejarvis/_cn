import { createServerFn } from "@tanstack/react-start";

import type { RegistryItemDetailInput } from "./detail.types";

export const getRegistryItemDetail = createServerFn({ method: "GET" })
  .inputValidator(validateRegistryItemDetailInput)
  .handler(async ({ data }) => {
    const { getRegistryItemDetailData } = await import("./detail.server");

    return getRegistryItemDetailData(data);
  });

function validateRegistryItemDetailInput(data: unknown): RegistryItemDetailInput {
  if (!isRecord(data)) {
    throw new Error("Expected registry item detail input.");
  }

  const { name } = data;

  if (typeof name !== "string" || name.length === 0) {
    throw new Error("Expected a registry item name.");
  }

  return { name };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
