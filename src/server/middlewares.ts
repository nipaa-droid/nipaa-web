import { HTTPMethod } from "../http/HttpMethod";
import { EnumUtils } from "../utils/enum";
import { User } from "next-auth";
import { NonNullableRequired } from "../utils/types";
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

    console.log("New session");
    console.log(ctx.session);

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
