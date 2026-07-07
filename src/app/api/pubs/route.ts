import { NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/serverApiUrl";
import { createApiProxyHandler } from "../utils/proxyHandler";

export const GET = createApiProxyHandler("/pubs", {
  resourceName: "pubs",
  forwardAuth: true,
});

export async function POST(request: Request): Promise<Response> {
  const apiUrl = getServerApiUrl();
  const apiKey = process.env.TESTING_API_KEY;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["X-API-Key"] = apiKey;
  const authHeader = request.headers.get("authorization");
  if (authHeader) headers.Authorization = authHeader;

  try {
    const body = await request.text();
    const response = await fetch(`${apiUrl}/pubs`, {
      method: "POST",
      headers,
      body,
    });
    const data: unknown = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create pub" },
      { status: 500 }
    );
  }
}
