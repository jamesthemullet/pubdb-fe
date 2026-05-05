import { createApiProxyHandler } from "../utils/proxyHandler";

export const GET = createApiProxyHandler("/api/v1/contributors/leaderboard", {
  resourceName: "leaderboard",
});
