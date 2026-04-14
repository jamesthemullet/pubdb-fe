import { createApiMutationHandler } from "../../utils/proxyHandler";

export const POST = createApiMutationHandler(
  "POST",
  "/payments/verify-session",
  { forwardAuth: true, resourceName: "session verification" }
);
