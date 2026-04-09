export function buildAuthHeaders(
  token: string | null | undefined
): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
