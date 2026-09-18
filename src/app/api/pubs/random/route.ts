import { createApiProxyHandler } from "../../utils/proxyHandler";

export const GET = createApiProxyHandler("/pubs/random", {
  resourceName: "random pub",
  forwardAuth: true,
  includeApiKey: false,
});
