import { createApiProxyHandler } from "../../../utils/proxyHandler";

export async function PATCH(request: Request): Promise<Response> {
  const handler = createApiProxyHandler("/auth/me/password", {
    forwardAuth: true,
    includeApiKey: false,
    method: "PATCH",
    forwardBody: true,
  });
  return handler(request);
}
