export function getServerApiUrl(): string {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:4000"
  );
}

export function getTestingApiKeyHeader(): Record<string, string> {
  const apiKey = process.env.TESTING_API_KEY;
  return apiKey ? { "X-API-Key": apiKey } : {};
}
