import { NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/serverApiUrl";
import { getAuthHeader } from "../../../utils/authCookie";

export async function GET(request: Request): Promise<Response> {
  const apiUrl = getServerApiUrl();
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "30d";
  try {
    const headers: Record<string, string> = getAuthHeader(request);
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
