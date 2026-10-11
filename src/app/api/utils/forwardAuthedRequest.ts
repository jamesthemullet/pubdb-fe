import { NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/serverApiUrl";
import { getAuthHeader } from "./authCookie";

/**
 * Forwards a request (method + JSON body) to the backend with the user's auth
 * token from the cookie, passing the backend's status and body straight back.
 */
export async function forwardAuthedRequest(
  request: Request,
  endpointPath: string
): Promise<Response> {
  const apiUrl = getServerApiUrl();
  try {
    const hasBody = request.method !== "GET" && request.method !== "DELETE";
    const headers: Record<string, string> = {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...getAuthHeader(request),
    };

    const response = await fetch(`${apiUrl}${endpointPath}`, {
      method: request.method,
      headers,
      ...(hasBody ? { body: await request.text() } : {}),
      cache: "no-store",
    });
    const data: unknown = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 500 }
    );
  }
}
