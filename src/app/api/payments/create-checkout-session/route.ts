import { createApiMutationHandler } from "../../utils/proxyHandler";

export const POST = createApiMutationHandler(
  "POST",
  "/payments/create-checkout-session",
  { forwardAuth: true, resourceName: "checkout session" }
);
