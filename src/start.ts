import { createMiddleware, createStart } from "@tanstack/react-start";

import { getMarkdownNegotiationResponseForRequest } from "./lib/negotiation.server";

const markdownNegotiationMiddleware = createMiddleware().server(({ next, pathname, request }) => {
  const response = getMarkdownNegotiationResponseForRequest(request, pathname);

  if (response) {
    return response;
  }

  return next();
});

export const startInstance = createStart(() => ({
  requestMiddleware: [markdownNegotiationMiddleware],
}));
