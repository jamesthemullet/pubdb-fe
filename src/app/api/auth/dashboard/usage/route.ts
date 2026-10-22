import { createApiProxyHandler } from "../../../utils/proxyHandler";

const proxyUsage = createApiProxyHandler("/auth/dashboard/usage", {
  forwardAuth: true,
  includeApiKey: false,
});

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (!url.searchParams.has("range")) {
    url.searchParams.set("range", "30d");
    request = new Request(url, request);
  }
  return proxyUsage(request);
}
