import { createPlaygroundProxyHandler } from "../utils/playgroundProxyHandler";

export const GET = createPlaygroundProxyHandler(() => "/api/v1/beer-types");
