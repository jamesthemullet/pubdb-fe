import { createPlaygroundProxyHandler } from "../../utils/playgroundProxyHandler";

export function GET(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  return params.then(({ id }) => {
    const handler = createPlaygroundProxyHandler(() => `/api/v1/pubs/${encodeURIComponent(id)}`);
    return handler(request);
  });
}
