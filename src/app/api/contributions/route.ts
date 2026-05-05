import { createApiProxyHandler } from "../utils/proxyHandler";

export const GET = createApiProxyHandler("/api/v1/auth/contributions", {
  forwardAuth: true,
  resourceName: "contributions",
});
