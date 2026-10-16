import { createApiProxyHandler } from "../../../utils/proxyHandler";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const handler = createApiProxyHandler(`/auth/keys/${encodeURIComponent(id)}`, {
    forwardAuth: true,
    includeApiKey: false,
    method: "DELETE",
  });
  return handler(request);
}
