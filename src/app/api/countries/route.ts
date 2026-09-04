import { NextResponse } from "next/server";
import { COUNTRIES } from "@/data/countries";

// Countries change essentially never, so this is served from a bundled
// static list rather than fetched from a third party. (It previously
// called restcountries.com, but that API's v3.1 endpoint was deprecated
// and its v5 replacement requires a paid-tier API key — see
// https://restcountries.com/docs/countries/legacy-api-deprecation.)
const CACHE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function GET(): Promise<Response> {
  return NextResponse.json(COUNTRIES, {
    headers: {
      "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400`,
    },
  });
}
