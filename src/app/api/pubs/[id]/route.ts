import { NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/serverApiUrl";
import { createApiProxyHandler } from "../../utils/proxyHandler";

export function GET(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  return params.then(({ id }) => {
    const handler = createApiProxyHandler(`/api/v1/pubs/${id}`, { forwardAuth: true });
    return handler(request);
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const apiUrl = getServerApiUrl();
  const apiKey = process.env.TESTING_API_KEY;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["X-API-Key"] = apiKey;
  const authHeader = request.headers.get("authorization");
  if (authHeader) headers.Authorization = authHeader;

  try {
    const body = await request.text();
    const response = await fetch(`${apiUrl}/pubs/${id}`, {
      method: "PATCH",
      headers,
      body,
    });
    const data: unknown = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update pub" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const apiUrl = getServerApiUrl();
  const apiKey = process.env.TESTING_API_KEY;

  const headers: Record<string, string> = {};
  if (apiKey) headers["X-API-Key"] = apiKey;
  const authHeader = request.headers.get("authorization");
  if (authHeader) headers.Authorization = authHeader;

  try {
    const response = await fetch(`${apiUrl}/pubs/${id}`, {
      method: "DELETE",
      headers,
    });
    if (response.status === 204 || response.headers.get("content-length") === "0") {
      return new Response(null, { status: response.status });
    }
    const data: unknown = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete pub" },
      { status: 500 }
    );
  }
}
