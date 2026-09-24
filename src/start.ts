import { createMiddleware, createStart } from "@tanstack/react-start";

import { getContentNegotiationResponseForRequest } from "./lib/negotiation.server";

const contentNegotiationMiddleware = createMiddleware().server(
  async ({ next, pathname, request }) => {
    const response = await getContentNegotiationResponseForRequest(request, pathname);

    if (response) {
      return response;
    }

    return next();
  },
);

export const startInstance = createStart(() => ({
  requestMiddleware: [contentNegotiationMiddleware],
}));
