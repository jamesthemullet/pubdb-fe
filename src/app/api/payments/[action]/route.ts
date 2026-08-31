import { NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/serverApiUrl";
import { getAuthHeader } from "../../utils/authCookie";

function buildHeaders(request: Request, includeContentType: boolean): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeContentType) headers["Content-Type"] = "application/json";
  return { ...headers, ...getAuthHeader(request) };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ action: string }> }
): Promise<Response> {
  const { action } = await params;
  const apiUrl = getServerApiUrl();
  try {
    const response = await fetch(`${apiUrl}/payments/${action}`, {
      headers: buildHeaders(request, false),
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> }
): Promise<Response> {
  const { action } = await params;
  const apiUrl = getServerApiUrl();
  try {
    const body = await request.text();
    const response = await fetch(`${apiUrl}/payments/${action}`, {
      method: "POST",
      headers: buildHeaders(request, true),
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
