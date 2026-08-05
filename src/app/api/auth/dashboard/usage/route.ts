import { NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/serverApiUrl";

export async function GET(request: Request): Promise<Response> {
  const apiUrl = getServerApiUrl();
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "30d";
  try {
    const headers: Record<string, string> = {};
    const authHeader = request.headers.get("authorization");
    if (authHeader) headers.Authorization = authHeader;
    const response = await fetch(
      `${apiUrl}/auth/dashboard/usage?range=${encodeURIComponent(range)}`,
      { headers, cache: "no-store" }
    );
    const data: unknown = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 500 }
    );
  }
}
