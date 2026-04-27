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
