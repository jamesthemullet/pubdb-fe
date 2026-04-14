import { createApiMutationHandler } from "../../utils/proxyHandler";

export const POST = createApiMutationHandler(
  "POST",
  "/payments/subscribe-to-hobby",
  { forwardAuth: true, resourceName: "hobby subscription" }
);
