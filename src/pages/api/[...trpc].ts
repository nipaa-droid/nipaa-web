import { createOpenApiNextHandler } from "trpc-openapi";
import { createContext } from "../../server/context";
import { appRouter } from "../../server/routers/_app";

// Handle incoming OpenAPI requests
export default createOpenApiNextHandler({
  // We already have type safety with the other trpc endpoint so it shouldn't matter much
  // this works around middlewares typing not being inferred properly
  // @ts-ignore
  router: appRouter,
  createContext,
});
