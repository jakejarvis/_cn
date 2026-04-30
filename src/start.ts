import { createMiddleware, createStart } from "@tanstack/react-start";

import { getContentNegotiationResponseForRequest } from "./lib/negotiation.server";

const contentNegotiationMiddleware = createMiddleware().server(({ next, pathname, request }) => {
  const response = getContentNegotiationResponseForRequest(request, pathname);

  if (response) {
    return response;
  }

  return next();
});

export const startInstance = createStart(() => ({
  requestMiddleware: [contentNegotiationMiddleware],
}));
