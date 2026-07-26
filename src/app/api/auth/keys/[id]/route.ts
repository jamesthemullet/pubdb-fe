import { NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/serverApiUrl";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const apiUrl = getServerApiUrl();
  try {
    const headers: Record<string, string> = {};
    const authHeader = request.headers.get("authorization");
    if (authHeader) headers.Authorization = authHeader;
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
