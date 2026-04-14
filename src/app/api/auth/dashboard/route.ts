import { createApiProxyHandler } from "../../utils/proxyHandler";

export const GET = createApiProxyHandler("/auth/dashboard", {
  forwardAuth: true,
  resourceName: "dashboard",
});
