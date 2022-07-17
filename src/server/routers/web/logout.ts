import { destroyCookie } from "nookies";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { CookieNames } from "../../../utils/cookies";
import { createRouter } from "../../createRouter";
import { protectedWithCookieBasedSessionMiddleware } from "../../middlewares";

export const webLogoutRouter = protectedWithCookieBasedSessionMiddleware(
  createRouter(),
  {
    id: true,
  }
).mutation("web-logout", {
  input: z.any(),
  output: z.any(),
  async resolve({ ctx }) {
    const { session } = ctx;

    // we want to destroy the main session cookie so path = "/"
    destroyCookie(ctx, CookieNames.SESSION_ID, { path: "/" });

    // handles racing conditions (can happen when a user per example spam logout button) or other edge cases
    try {
      await prisma.userSession.delete({
        where: {
          id: session.id,
        },
      });
    } catch (e) {
      console.log(e);
    }
  },
});
