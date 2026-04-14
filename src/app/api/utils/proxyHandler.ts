import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/serverApiUrl";

type ProxyOptions = {
  forwardAuth?: boolean;
  resourceName?: string;
};

async function proxyRequest(
  request: NextRequest,
  method: string,
  endpointPath: string,
  options?: ProxyOptions
) {
  const apiUrl = getServerApiUrl();
  const apiKey = process.env.TESTING_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 500 });
  }

  const headers: Record<string, string> = { "X-API-Key": apiKey };

  if (options?.forwardAuth) {
    const authToken = request.cookies.get("auth-token")?.value;
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    cache: "no-store",
  };

  if (method !== "GET" && method !== "HEAD") {
    const contentType = request.headers.get("content-type");
    if (contentType) {
      headers["Content-Type"] = contentType;
    }
    try {
      const body = await request.text();
      if (body) {
        fetchOptions.body = body;
      }
    } catch {
      // no body
    }
  }

  try {
    const response = await fetch(`${apiUrl}${endpointPath}`, fetchOptions);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        data || { error: `Failed to fetch ${options?.resourceName ?? "resource"}` },
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
            : `Failed to fetch ${options?.resourceName ?? "resource"}`,
      },
      { status: 500 }
    );
  }
}

export function createApiProxyHandler(
  endpointPath: string,
  options?: ProxyOptions
) {
  return (request: NextRequest) =>
    proxyRequest(request, "GET", endpointPath, options);
}

export function createApiMutationHandler(
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  endpointPath: string,
  options?: ProxyOptions
) {
  return (request: NextRequest) =>
    proxyRequest(request, method, endpointPath, options);
}
