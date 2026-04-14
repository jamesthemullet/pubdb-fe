import { createApiMutationHandler } from "../../utils/proxyHandler";

export const POST = createApiMutationHandler("POST", "/auth/forgot-api-key", {
  forwardAuth: true,
  resourceName: "API key reminder",
});
