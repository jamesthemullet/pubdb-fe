import { createApiProxyHandler } from "../../utils/proxyHandler";

export const GET = createApiProxyHandler("/auth/me", {
  resourceName: "auth/me",
  forwardAuth: true,
});
