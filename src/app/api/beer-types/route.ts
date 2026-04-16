import { createApiProxyHandler } from "../utils/proxyHandler";

export const GET = createApiProxyHandler("/api/v1/beer-types", {
  forwardAuth: true,
  resourceName: "beer types",
  cache: "force-cache",
});
