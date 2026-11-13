import { createApiProxyHandler } from "../../utils/proxyHandler";

export function GET(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  return params.then(({ id }) => {
    const handler = createApiProxyHandler(`/api/v1/pubs/${id}`, { forwardAuth: true });
    return handler(request);
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const handler = createApiProxyHandler(`/pubs/${id}`, {
    forwardAuth: true,
    includeApiKey: false,
    method: "PATCH",
    forwardBody: true,
    errorFallback: "Failed to update pub",
  });
  return handler(request);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const handler = createApiProxyHandler(`/pubs/${id}`, {
    forwardAuth: true,
    includeApiKey: false,
    method: "DELETE",
    errorFallback: "Failed to delete pub",
  });
  return handler(request);
}
