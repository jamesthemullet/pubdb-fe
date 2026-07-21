import { createPlaygroundProxyHandler } from "../utils/playgroundProxyHandler";

export const GET = createPlaygroundProxyHandler((forwardParams) => {
  const qs = forwardParams.toString();
  return `/api/v1/pubs${qs ? `?${qs}` : ""}`;
});
