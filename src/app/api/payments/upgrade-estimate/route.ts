import { createApiMutationHandler } from "../../utils/proxyHandler";

export const POST = createApiMutationHandler(
  "POST",
  "/payments/upgrade-estimate",
  { forwardAuth: true, resourceName: "upgrade estimate" }
);
