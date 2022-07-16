import { Prisma } from "@prisma/client";
import { AnyRouter } from "@trpc/server";
import assert from "assert";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { TRPC_ERRORS } from "./errors";
import { shapeWithSecret, shapeWithSSID } from "./shapes";
import nookies from "nookies";
import { isCommonRequest } from "./context";
import { CookieNames } from "../utils/cookies";

export const requiredApplicationSecretMiddleware = <C>(
  router: AnyRouter<C>
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
  C,
  T extends Prisma.UserSessionSelect
>(
  router: AnyRouter<C>,
  select: T
) => {
  return router.middleware(async ({ next, rawInput, ctx }) => {
    const sessionIDSchema = z.object({ ...shapeWithSSID });

    assert(select);

    const validate = await sessionIDSchema.safeParseAsync(rawInput);

    if (!validate.success) {
      throw TRPC_ERRORS.UNAUTHORIZED;
    }

    const { ssid } = validate.data;

    const session = await prisma.userSession.findUnique({
      where: {
        id: ssid,
      },
      select,
    });

    if (!session) {
      throw TRPC_ERRORS.UNAUTHORIZED;
    }

    return next({
      ctx: {
        ...ctx,
        session,
      },
    });
  });
};

export const protectedWithCookieBasedSessionMiddleware = <
  C,
  T extends Prisma.UserSessionSelect
>(
  router: AnyRouter<C>,
  select: T
) => {
  return router.middleware(async ({ next, ctx }) => {
    assert(isCommonRequest(ctx));

    const cookies = nookies.get(ctx);

    const session = cookies[CookieNames.SESSION_ID];

    if (!session) {
      throw TRPC_ERRORS.UNAUTHORIZED;
    }

    const foundSession = await prisma.userSession.findUnique({
      where: {
        id: session,
      },
      select,
    });

    if (!foundSession) {
      throw TRPC_ERRORS.UNAUTHORIZED;
    }

    return next({
      ctx: {
        ...ctx,
        session: foundSession,
      },
    });
  });
};
