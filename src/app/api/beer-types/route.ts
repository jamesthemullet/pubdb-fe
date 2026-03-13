import { NextResponse } from "next/server";

export const GET = async (request: Request) => {
  const apiUrl =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
  const apiKey = process.env.TESTING_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 500 });
  }

  const headers: HeadersInit = { "X-API-Key": apiKey };
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    headers.Authorization = authHeader;
  }

  try {
    const response = await fetch(`${apiUrl}/api/v1/beer-types`, {
      headers,
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        data || { error: "Failed to fetch beer types" },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch beer types",
      },
      { status: 500 }
    );
  }
};
