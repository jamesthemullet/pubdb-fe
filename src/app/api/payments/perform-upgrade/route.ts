import { createApiMutationHandler } from "../../utils/proxyHandler";

export const POST = createApiMutationHandler(
  "POST",
  "/payments/perform-upgrade",
  { forwardAuth: true, resourceName: "upgrade" }
);
