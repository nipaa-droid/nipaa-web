import { OsuDroidUser, Prisma } from "@prisma/client";
import { AnyRouter } from "@trpc/server";
import assert from "assert";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { verifyToken } from "../components/auth/token";
import { MustHave } from "../utils/types";
import { TRPC_ERRORS } from "./errors";
import { shapeWithSecret, shapeWithToken, shapeWithUserID } from "./shapes";

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

type RequiredForAuthenticationKeys = keyof Pick<OsuDroidUser, "password">;

export const protectedWithSessionMiddleware = <
  C,
  T extends MustHave<Prisma.OsuDroidUserSelect, RequiredForAuthenticationKeys>
>(
  router: AnyRouter<C>,
  select: T
) => {
  if (!select) {
    select = { password: true } as T;
  }

  return router.middleware(async ({ next, rawInput, ctx }) => {
    const sessionIDSchema = z.object({ ...shapeWithToken, ...shapeWithUserID });

    assert(select);

    const validate = await sessionIDSchema.safeParseAsync(rawInput);

    if (!validate.success) {
      throw TRPC_ERRORS.UNAUTHORIZED;
    }

    const { token, userID } = validate.data;

    const user = await prisma.osuDroidUser.findUnique({
      where: {
        id: Number(userID),
      },
      select,
    });

    if (!user) {
      throw TRPC_ERRORS.UNAUTHORIZED;
    }

    const typedUser = user as Pick<OsuDroidUser, RequiredForAuthenticationKeys>;

    const verified = await verifyToken(token, {
      id: userID,
      hashedPassword: typedUser.password,
    });

    if (!verified) {
      throw TRPC_ERRORS.UNAUTHORIZED;
    }

    return next({
      ctx: {
        ...ctx,
        user: user,
      },
    });
  });
};
