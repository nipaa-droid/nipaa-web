import { HTTPMethod } from "../http/HTTPMethod";
import { AnyRouter } from "@trpc/server";
import { Context } from "./context";
import { TRPC_ERRORS } from "./errors";
import { EnumUtils } from "../utils/enum";

export const protectRouteWithMethods = (
  router: AnyRouter<Context>,
  methods: HTTPMethod[]
) => {
  return router.middleware(({ next, ctx }) => {
    const error = TRPC_ERRORS.METHOD_NOT_SUPPORTED;

    if (!ctx.req.method) {
      throw error;
    }

    const method = EnumUtils.getValueByKeyUntyped(HTTPMethod, ctx.req.method);

    if (!method) {
      throw error;
    }

    if (!methods.includes(method)) {
      throw error;
    }

    return next();
  });
};
