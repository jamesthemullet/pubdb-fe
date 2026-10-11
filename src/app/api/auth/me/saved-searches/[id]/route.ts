import { forwardAuthedRequest } from "../../../../utils/forwardAuthedRequest";

type RouteContext = { params: Promise<{ id: string }> };

async function forward(request: Request, { params }: RouteContext): Promise<Response> {
  const { id } = await params;
  return forwardAuthedRequest(
    request,
    `/auth/me/saved-searches/${encodeURIComponent(id)}`
  );
}

export const PATCH = forward;
export const DELETE = forward;
