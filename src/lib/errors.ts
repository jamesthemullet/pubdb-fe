type HttpErrorData = { message?: string; error?: string };

type HttpErrorObject = {
  response: Response;
  data: HttpErrorData;
};

/** Type guard for objects thrown as `{ response, data }` in API-fetching code. */
export function isHttpErrorObject(err: unknown): err is HttpErrorObject {
  return (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    "data" in err &&
    (err as Record<string, unknown>).response instanceof Response
  );
}

/** Extracts a `message` string from an unknown API response body. */
export function getResponseMessage(data: unknown): string | undefined {
  if (typeof data === "object" && data !== null) {
    const val = (data as Record<string, unknown>).message;
    if (typeof val === "string") return val;
  }
  return undefined;
}

/** Extracts a human-readable message from any caught value. */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === "object" && err !== null) {
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === "string" && obj.message) return obj.message;
    if (typeof obj.error === "string" && obj.error) return obj.error;
  }
  return fallback;
}

/** Extracts a human-readable error message from an unknown API response body.
 *  Checks `error`, `message`, and `errors` fields in that order. */
export function getApiError(data: unknown, fallback = "Unknown error"): string {
  if (typeof data !== "object" || data === null) return fallback;
  const obj = data as Record<string, unknown>;
  if (typeof obj.error === "string" && obj.error) return obj.error;
  if (typeof obj.message === "string" && obj.message) return obj.message;
  if (typeof obj.errors === "string" && obj.errors) return obj.errors;
  if (Array.isArray(obj.errors) && obj.errors.length > 0) {
    const first = obj.errors[0];
    return typeof first === "string" ? first : fallback;
  }
  return fallback;
}
