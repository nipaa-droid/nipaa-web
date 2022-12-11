import { z } from "zod";
import { OsuDroidUserHelper } from "../../../database/helpers/OsuDroidUserHelper";
import { createRouter } from "../../createRouter";
import { protectedWithCookieBasedSessionMiddleware } from "../../middlewares";

export const webRefreshmentEndpoint = protectedWithCookieBasedSessionMiddleware(
  createRouter(),
  { id: true, expires: true }
).mutation("web-refresh", {
  input: z.any(),
  output: z.any(),
  async resolve({ ctx }) {
    const { session } = ctx;
    await OsuDroidUserHelper.refreshSession(session);
  },
});
