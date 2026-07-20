import { NextResponse } from "next/server";

const RESTCOUNTRIES_URL = "https://restcountries.com/v3.1/all?fields=name,cca2";
const FETCH_TIMEOUT_MS = 5000;

export async function GET(): Promise<NextResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(RESTCOUNTRIES_URL, {
      signal: controller.signal,
      cache: "no-store",
    });
    const data: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        data || { error: "Failed to fetch countries" },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: server-side error logging for the proxy
    console.error("Proxy error for countries:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}
