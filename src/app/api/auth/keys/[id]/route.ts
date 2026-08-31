import { NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/serverApiUrl";
import { getAuthHeader } from "../../../utils/authCookie";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const apiUrl = getServerApiUrl();
  try {
    const headers: Record<string, string> = getAuthHeader(request);
    const response = await fetch(`${apiUrl}/auth/keys/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers,
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
