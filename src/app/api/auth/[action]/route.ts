import { NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/serverApiUrl";
import { getAuthHeader, setAuthCookie } from "../../utils/authCookie";

function buildHeaders(request: Request, includeContentType: boolean): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeContentType) headers["Content-Type"] = "application/json";
  return { ...headers, ...getAuthHeader(request) };
}

function isLoginTokenPayload(value: unknown): value is { token: string; [key: string]: unknown } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { token?: unknown }).token === "string"
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ action: string }> }
): Promise<Response> {
  const { action } = await params;
  const apiUrl = getServerApiUrl();
  try {
    const response = await fetch(`${apiUrl}/auth/${action}`, {
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
    const response = await fetch(`${apiUrl}/auth/${action}`, {
      method: "POST",
      headers: buildHeaders(request, true),
      body,
    });
    const data: unknown = await response.json().catch(() => null);

    if (action === "login" && response.ok && isLoginTokenPayload(data)) {
      const { token, ...rest } = data;
      const nextResponse = NextResponse.json(rest, { status: response.status });
      setAuthCookie(nextResponse, token);
      return nextResponse;
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 500 }
    );
  }
}
