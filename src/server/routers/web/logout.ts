import { destroyCookie } from "nookies";
import { z } from "zod";
import { OsuDroidUserHelper } from "../../../database/helpers/OsuDroidUserHelper";
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
    destroyCookie(ctx, CookieNames.HAS_SESSION_COOKIE, { path: "/" });
    
    await OsuDroidUserHelper.deleteSession(session.id);
  },
});
