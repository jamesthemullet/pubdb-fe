import { createApiProxyHandler } from "../../../../utils/proxyHandler";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const handler = createApiProxyHandler(`/auth/keys/${encodeURIComponent(id)}/regenerate`, {
    forwardAuth: true,
    includeApiKey: false,
    method: "POST",
    forwardBody: true,
  });
  return handler(request);
}
