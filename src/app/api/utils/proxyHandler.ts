import { NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/serverApiUrl";

export function createApiProxyHandler(
  endpointPath: string,
  options?: { forwardAuth?: boolean; resourceName?: string }
): (request: Request) => Promise<NextResponse> {
  return async (request: Request) => {
    const apiUrl = getServerApiUrl();
    const apiKey = process.env.TESTING_API_KEY;

    const headers: Record<string, string> = {};
    if (apiKey) headers["X-API-Key"] = apiKey;
    if (options?.forwardAuth) {
      const authHeader = request.headers.get("authorization");
      if (authHeader) {
        headers.Authorization = authHeader;
      }
    }

    try {
      const { search } = new URL(request.url);
      const response = await fetch(`${apiUrl}${endpointPath}${search}`, {
        headers,
        cache: "no-store",
      });
      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        return NextResponse.json(
          data || { error: `Failed to fetch ${options?.resourceName}` },
          { status: response.status }
        );
      }

      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: server-side error logging
      console.error(`Proxy error for ${endpointPath}:`, error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
