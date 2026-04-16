import { createApiProxyHandler } from "../../utils/proxyHandler";

export const GET = createApiProxyHandler("/auth/me", {
  forwardAuth: true,
  resourceName: "user",
});
