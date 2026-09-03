import { NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/serverApiUrl";
import { getAuthHeader } from "../../../utils/authCookie";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const apiUrl = getServerApiUrl();

  try {
    const formData = await request.formData();
    const response = await fetch(`${apiUrl}/pubs/${id}/image`, {
      method: "POST",
      headers: getAuthHeader(request),
      body: formData,
    });
    const data: unknown = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload pub image" },
      { status: 500 }
    );
  }
}
