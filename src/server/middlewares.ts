import { AnyRouter } from "@trpc/server";
import { z } from "zod";
import { Context } from "./context";
import { TRPC_ERRORS } from "./errors";
import { shapeWithSecret } from "./shapes";

export const requiredApplicationSecretMiddleware = (
  router: AnyRouter<Context>
) => {
  return router.middleware(async ({ next, rawInput, ctx }) => {
    const secretSchema = z.object({ ...shapeWithSecret });

    const validated = await secretSchema.safeParseAsync(rawInput);

    if (!validated.success) {
      throw TRPC_ERRORS.UNAUTHORIZED;
    }

    const { secret } = validated.data;

    if (secret !== process.env.APP_SECRET) {
      throw TRPC_ERRORS.UNAUTHORIZED;
    }

    return next({
      ctx: {
        ...ctx,
        secret,
      },
    });
  });
};
