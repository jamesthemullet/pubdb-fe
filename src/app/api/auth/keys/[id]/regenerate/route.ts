import { NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/serverApiUrl";
import { getAuthHeader } from "../../../../utils/authCookie";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const apiUrl = getServerApiUrl();
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...getAuthHeader(request),
    };
    const body = await request.text();
    const response = await fetch(
      `${apiUrl}/auth/keys/${encodeURIComponent(id)}/regenerate`,
      {
        method: "POST",
        headers,
        body,
      }
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
