import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/serverApiUrl";

export async function POST(request: NextRequest) {
  const apiUrl = getServerApiUrl();
  const apiKey = process.env.TESTING_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 500 });
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        data || { error: "Login failed" },
        { status: response.status }
      );
    }

    const { token, ...rest } = (data ?? {}) as Record<string, unknown>;
    const res = NextResponse.json(rest, { status: response.status });

    if (token) {
      res.cookies.set("auth-token", String(token), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return res;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed" },
      { status: 500 }
    );
  }
}
