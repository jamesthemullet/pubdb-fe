import { NextResponse } from "next/server";

// Countries change essentially never, so cache aggressively both in Next's
// data cache and at the CDN edge.
const REVALIDATE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function GET() {
  try {
    const res = await fetch(
      "https://restcountries.com/v3.1/all?fields=name,cca2",
      { next: { revalidate: REVALIDATE_SECONDS } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch countries" },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch countries" },
      { status: 502 }
    );
  }
}
