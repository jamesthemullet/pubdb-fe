import { createApiProxyHandler } from "../../utils/proxyHandler";

export const GET = createApiProxyHandler("/api/v1/pubs", {
  resourceName: "pubs",
  forwardAuth: true,
  includeApiKey: false,
});
