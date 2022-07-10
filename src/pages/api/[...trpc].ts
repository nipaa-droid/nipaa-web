import { createOpenApiNextHandler } from "trpc-openapi";
import { createContext } from "../../server/context";
import { appRouter } from "../../server/routers/_app";

// Handle incoming OpenAPI requests
export default createOpenApiNextHandler({
  router: appRouter,
  createContext,
});
