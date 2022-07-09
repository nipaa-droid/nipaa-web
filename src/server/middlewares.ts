import { HTTPMethod } from "../http/HTTPMethod";
import { EnumUtils } from "../utils/enum";
import { AnyRouter } from "@trpc/server";
import { Context } from "./context";
import { TRPC_ERRORS } from "./errors";
import { schemaWithSSID } from "./schemas";
import { prisma } from "../../lib/prisma";
import { Prisma } from "@prisma/client";

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

export const protectRouteWithAuthentication = (
  router: AnyRouter<Context>,
  query?: Prisma.OsuDroidUserFindUniqueArgs
) => {
  return router.middleware(async ({ next, ctx }) => {
    const { body } = ctx.req.body;

    const withSessionID = await schemaWithSSID.safeParseAsync(body);

    if (!withSessionID) {
      throw TRPC_ERRORS.UNAUTHORIZED;
    }

    const { ssid } = await schemaWithSSID.parseAsync(body);

    const user = prisma.osuDroidUser.findUnique({
      ...{
        where: {
          session: ssid,
        },
      },
      ...query,
    });

    return next({ ctx: { ...ctx, user } });
  });
};
