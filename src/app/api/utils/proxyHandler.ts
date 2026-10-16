import { NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/serverApiUrl";
import { getAuthHeader } from "./authCookie";

export function createApiProxyHandler(
  endpointPath: string,
  options?: {
    forwardAuth?: boolean;
    resourceName?: string;
    includeApiKey?: boolean;
    method?: string;
    forwardBody?: boolean;
    errorFallback?: string;
  }
): (request: Request) => Promise<NextResponse> {
  return async (request: Request) => {
    const apiUrl = getServerApiUrl();
    const apiKey = process.env.TESTING_API_KEY;
    const method = options?.method ?? "GET";

    const headers: Record<string, string> = {};
    if (apiKey && options?.includeApiKey !== false) headers["X-API-Key"] = apiKey;
    if (options?.forwardAuth) {
      Object.assign(headers, getAuthHeader(request));
    }

    let body: string | undefined;
    if (options?.forwardBody) {
      body = await request.text();
      headers["Content-Type"] = "application/json";
    }

    try {
      const { search } = new URL(request.url);
      const response = await fetch(`${apiUrl}${endpointPath}${search}`, {
        ...(method !== "GET" ? { method } : {}),
        headers,
        ...(body !== undefined ? { body } : {}),
        ...(method === "GET" ? { cache: "no-store" as const } : {}),
      });

      if (response.status === 204 || response.headers.get("content-length") === "0") {
        return new NextResponse(null, { status: response.status });
      }

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        return NextResponse.json(
          data || { error: `Failed to fetch ${options?.resourceName}` },
          { status: response.status }
        );
      }

      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: server-side error logging for the proxy
      console.error(`Proxy error for ${endpointPath}:`, error);
      if (method === "GET") {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }
      const message = error instanceof Error ? error.message : options?.errorFallback ?? "Request failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}
