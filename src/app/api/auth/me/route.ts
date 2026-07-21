import { NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/serverApiUrl";
import { createApiProxyHandler } from "../../utils/proxyHandler";

export const GET = createApiProxyHandler("/auth/me", {
  resourceName: "auth/me",
  forwardAuth: true,
  includeApiKey: false,
});

export async function PATCH(request: Request): Promise<Response> {
  const apiUrl = getServerApiUrl();
  try {
    const body = await request.text();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const authHeader = request.headers.get("authorization");
    if (authHeader) headers.Authorization = authHeader;

    const response = await fetch(`${apiUrl}/auth/me`, {
      method: "PATCH",
      headers,
      body,
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

export async function DELETE(request: Request): Promise<Response> {
  const apiUrl = getServerApiUrl();
  try {
    const body = await request.text();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const authHeader = request.headers.get("authorization");
    if (authHeader) headers.Authorization = authHeader;

    const response = await fetch(`${apiUrl}/auth/me`, {
      method: "DELETE",
      headers,
      body,
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
