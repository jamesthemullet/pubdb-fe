import { NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/serverApiUrl";

type PlaygroundTokenResponse = { token: string; tier?: string; expiresIn?: number };

const RATE_LIMIT_HEADERS = ["x-ratelimit-remaining", "x-ratelimit-limit", "x-ratelimit-reset"];

function isPlaygroundTokenResponse(value: unknown): value is PlaygroundTokenResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).token === "string"
  );
}

/**
 * Builds a GET handler that mints a short-lived playground token for the
 * caller's selected key (via the backend's Bearer-authenticated
 * playground-token endpoint) and uses it as X-API-Key on the real request.
 * `buildEndpointPath` receives the incoming query params with `id`
 * already stripped, so it can forward the rest (or ignore them) as needed.
 */
export function createPlaygroundProxyHandler(
  buildEndpointPath: (forwardParams: URLSearchParams) => string
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const apiUrl = getServerApiUrl();
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    try {
      const tokenRes = await fetch(
        `${apiUrl}/auth/keys/${encodeURIComponent(id)}/playground-token`,
        { method: "POST", headers: { Authorization: authHeader } }
      );
      const tokenData: unknown = await tokenRes.json().catch(() => null);

      if (!tokenRes.ok || !isPlaygroundTokenResponse(tokenData)) {
        return NextResponse.json(
          tokenData ?? { error: "Failed to mint playground token" },
          { status: tokenRes.status }
        );
      }

      const forwardParams = new URLSearchParams(searchParams);
      forwardParams.delete("id");

      const response = await fetch(`${apiUrl}${buildEndpointPath(forwardParams)}`, {
        headers: { "X-API-Key": tokenData.token },
        cache: "no-store",
      });
      const data: unknown = await response.json().catch(() => null);

      const headers: Record<string, string> = {};
      for (const header of RATE_LIMIT_HEADERS) {
        const value = response.headers.get(header);
        if (value) headers[header] = value;
      }

      return NextResponse.json(data, { status: response.status, headers });
    } catch {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
