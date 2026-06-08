import { createApiProxyHandler } from "../../utils/proxyHandler";

export function GET(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  return params.then(({ id }) => {
    const handler = createApiProxyHandler(`/api/v1/pubs/${id}`, { forwardAuth: true });
    return handler(request);
  });
}
