import { HTTPMethod } from "../http/HttpMethod";
import { EnumUtils } from "../utils/EnumUtils";
import { User } from "next-auth";
import { NonNullableRequired } from "../utils/TypeUtils";
import * as trpc from "@trpc/server";
import { AnyRouter } from "@trpc/server";
import { Context } from "./context";

const MIDDLEWARE_ERRORS = {
  METHOD_NOT_SUPPORTED: new trpc.TRPCError({ code: "METHOD_NOT_SUPPORTED" }),
  UNAUTHORIZED: new trpc.TRPCError({ code: "UNAUTHORIZED" }),
};

export const protectRouteWithMethods = (
  router: AnyRouter<Context>,
  methods: HTTPMethod[]
) => {
  return router.middleware(({ next, ctx }) => {
    const error = MIDDLEWARE_ERRORS.METHOD_NOT_SUPPORTED;

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

export const protectRouteWithAuthentication = (router: AnyRouter<Context>) => {
  return router.middleware(({ next, ctx }) => {
    const error = MIDDLEWARE_ERRORS.UNAUTHORIZED;

    if (
      !ctx.session ||
      !ctx.session.user ||
      !ctx.session.user.email ||
      !ctx.session.user.name
    ) {
      throw error;
    }

    return next({
      ctx: {
        ...ctx,
        session: {
          ...ctx.session,
          user: ctx.session.user as NonNullableRequired<User>,
        },
      },
    });
  });
};
