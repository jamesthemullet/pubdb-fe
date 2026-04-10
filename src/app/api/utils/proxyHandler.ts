import { NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/serverApiUrl";

export function createApiProxyHandler(
  endpointPath: string,
  options?: { forwardAuth?: boolean; resourceName?: string }
) {
  return async (request: Request) => {
    const apiUrl = getServerApiUrl();
    const apiKey = process.env.TESTING_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const headers: HeadersInit = { "X-API-Key": apiKey };
    if (options?.forwardAuth) {
      const authHeader = request.headers.get("authorization");
      if (authHeader) {
        headers.Authorization = authHeader;
      }
    }

    try {
      const response = await fetch(`${apiUrl}${endpointPath}`, {
        headers,
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return NextResponse.json(
          data || { error: `Failed to fetch ${options?.resourceName}` },
          { status: response.status }
        );
      }

      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : `Failed to fetch ${options?.resourceName}`,
        },
        { status: 500 }
      );
    }
  };
}
