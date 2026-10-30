const LOGIN_PATH = "/register";
const REDIRECT_PARAM = "redirect";

/** Pages that make no sense to land back on after logging in. */
const AUTH_PATHS = new Set([LOGIN_PATH, "/forgot-password", "/reset-password", "/verify"]);

/**
 * Returns `value` as a same-origin path (pathname + search + hash), or null if it
 * is missing, points at another origin, or is one of the auth pages.
 */
export function getSafeRedirectPath(value: string | null | undefined, origin: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin) return null;
    if (AUTH_PATHS.has(url.pathname)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/** Link to the login page that sends the user back to `returnTo` once they log in. */
export function getLoginHref(returnTo?: string | null): string {
  if (!returnTo?.startsWith("/") || returnTo === "/") return LOGIN_PATH;
  const pathname = returnTo.split(/[?#]/)[0];
  if (AUTH_PATHS.has(pathname)) return LOGIN_PATH;
  return `${LOGIN_PATH}?${REDIRECT_PARAM}=${encodeURIComponent(returnTo)}`;
}

/** Reads the post-login destination from the login page's query string. */
export function getRedirectFromSearch(search: string, origin: string): string | null {
  return getSafeRedirectPath(new URLSearchParams(search).get(REDIRECT_PARAM), origin);
}
