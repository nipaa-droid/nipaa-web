import { Prisma } from "@prisma/client";
import { AnyRouter } from "@trpc/server";
import assert from "assert";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { TRPC_ERRORS } from "./errors";
import { shapeWithSecret } from "./shapes";
import nookies from "nookies";
import { CommonRequest, isCommonRequest } from "./context";
import { CookieNames } from "../utils/cookies";
import { OsuDroidUserHelper } from "../database/helpers/OsuDroidUserHelper";

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

const getSessionFromCookie = async <T extends Prisma.UserSessionSelect>(
  ctx: CommonRequest,
  select: T
) => {
  const cookies = nookies.get(ctx);
  const session = cookies[CookieNames.SESSION_ID];

  if (!session) {
    return undefined;
  }

  const foundSession = await prisma.userSession.findUnique({
    where: {
      id: session,
    },
    select,
  });

  if (!foundSession) {
    return undefined;
  }

  return foundSession;
};

export const commonRequestMiddleware = <C>(router: AnyRouter<C>) => {
  return router.middleware(async ({ next, ctx }) => {
    assert(isCommonRequest(ctx));
    return next({ ctx });
  });
};

export const protectedWithCookieBasedSessionMiddleware = <
  C,
  T extends Prisma.UserSessionSelect
>(
  router: AnyRouter<C>,
  select: T
) => {
  return commonRequestMiddleware(router).middleware(async ({ next, ctx }) => {
    const session = await getSessionFromCookie(ctx, select);

    if (!session) {
      throw TRPC_ERRORS.UNAUTHORIZED;
    }

    return next({
      ctx: {
        ...ctx,
        session: session,
      },
    });
  });
};

/**
 * This middleware shall be used in endpoints which don't need authentication
 * but still says that an user isn't idle
 */
export const endpointWithSessionRefreshmentMiddleware = <C>(
  router: AnyRouter<C>
) => {
  return commonRequestMiddleware(router).middleware(async ({ next, ctx }) => {
    const session = await getSessionFromCookie(ctx, {
      id: true,
      expires: true,
    });

    /**
     * since this is an endpoint that may or may not refresh the session we ignore
     * if the session isn't present
     */
    if (!session) {
      return next();
    }

    await OsuDroidUserHelper.refreshSession(session);

    return next();
  });
};
