import { forwardAuthedRequest } from "../../../utils/forwardAuthedRequest";

export function GET(request: Request): Promise<Response> {
  return forwardAuthedRequest(request, "/auth/me/saved-searches");
}

export function POST(request: Request): Promise<Response> {
  return forwardAuthedRequest(request, "/auth/me/saved-searches");
}
