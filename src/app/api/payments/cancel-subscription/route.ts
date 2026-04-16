import { createApiMutationHandler } from "../../utils/proxyHandler";

export const POST = createApiMutationHandler(
  "POST",
  "/payments/cancel-subscription",
  { forwardAuth: true, resourceName: "subscription cancellation" }
);
