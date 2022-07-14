import { Prisma } from "@prisma/client";
import { AnyRouter } from "@trpc/server";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { Context } from "./context";
import { TRPC_ERRORS } from "./errors";
import { shapeWithSecret, shapeWithSSID } from "./shapes";

export const requiredApplicationSecretMiddleware = (
  router: AnyRouter<Context>
) => {
  return router.middleware(async ({ next, rawInput }) => {
    const secretSchema = z.object({ ...shapeWithSecret });

    const validated = await secretSchema.safeParseAsync(rawInput);

    if (!validated.success) {
      throw TRPC_ERRORS.UNAUTHORIZED;
    }

    const { secret } = validated.data;

    if (secret !== process.env.APP_SECRET) {
      throw TRPC_ERRORS.UNAUTHORIZED;
    }

    // we don't swap context because this middleware expects input
    // to have the secret, it only exists for validation
    return next();
  });
};

export const protectedWithSessionMiddleware = <
  T extends Prisma.OsuDroidUserSelect
>(
  router: AnyRouter<Context>,
  select: T
) => {
  if (!select) {
    select = { id: true } as T;
  }

  return router.middleware(async ({ next, rawInput, ctx }) => {
    const sessionIDSchema = z.object({ ...shapeWithSSID });

    const validate = await sessionIDSchema.safeParseAsync(rawInput);

    if (!validate.success) {
      throw TRPC_ERRORS.UNAUTHORIZED;
    }

    const { ssid } = validate.data;

    const user = await prisma.osuDroidUser.findUnique({
      where: {
        session: ssid,
      },
      select,
    });

    if (!user) {
      throw TRPC_ERRORS.UNAUTHORIZED;
    }

    return next({
      ctx: {
        ...ctx,
        user,
      },
    });
  });
};
