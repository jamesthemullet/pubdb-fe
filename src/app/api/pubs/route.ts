import { NextResponse } from "next/server";

export const GET = async () => {
  const apiUrl =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
  const apiKey = process.env.TESTING_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 500 });
  }

  try {
    const response = await fetch(`${apiUrl}/api/v1/pubs`, {
      headers: { "X-API-Key": apiKey },
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(data || { error: "Failed to fetch pubs" }, {
        status: response.status,
      });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch pubs",
      },
      { status: 500 }
    );
  }
};
