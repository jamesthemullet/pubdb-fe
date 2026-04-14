import type { NextRequest } from "next/server";
import { createApiMutationHandler } from "../../utils/proxyHandler";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return createApiMutationHandler("PATCH", `/pubs/${id}`, {
    forwardAuth: true,
    resourceName: "pub",
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return createApiMutationHandler("DELETE", `/pubs/${id}`, {
    forwardAuth: true,
    resourceName: "pub",
  })(request);
}
