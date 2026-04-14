import { createApiMutationHandler, createApiProxyHandler } from "../utils/proxyHandler";

export const GET = createApiProxyHandler("/api/v1/pubs", {
  resourceName: "pubs",
});

export const POST = createApiMutationHandler("POST", "/pubs", {
  forwardAuth: true,
  resourceName: "pub",
});
