import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { createRouter } from "../../createRouter";
import { shapeWithUsernameWithPassword } from "../../shapes";
import bcrypt from "bcrypt";
import { TRPC_ERRORS } from "../../errors";
import { OsuDroidUserHelper } from "../../../database/helpers/OsuDroidUserHelper";
import { setCookie } from "nookies";
import { CookieNames } from "../../../utils/cookies";
import { putSessionCookie } from "../../utils";
import { commonRequestMiddleware } from "../../middlewares";

export const webLoginRouter = commonRequestMiddleware(createRouter()).mutation(
  "web-login",
  {
    input: z.object({
      ...shapeWithUsernameWithPassword,
    }),
    async resolve({ input, ctx }) {
      const { username, password } = input;

      const user = await prisma.osuDroidUser.findUnique({
        where: {
          name: username,
        },
        select: {
          id: true,
          sessions: true,
          password: true,
        },
      });

      if (!user) {
        throw TRPC_ERRORS.UNAUTHORIZED;
      }

      const authorized = await bcrypt.compare(password, user.password);

      if (!authorized) {
        throw TRPC_ERRORS.UNAUTHORIZED;
      }

      const session = await OsuDroidUserHelper.createSession(
        user.id,
        user.sessions
      );

      /**
       * We must rewrite cookie path so it is loaded by the client properly
       * by properly meaning when the user enters any page without any delay
       */
      putSessionCookie(ctx, session);

      /**
       * This cookie indicates that there is the http only session cookie for the client
       */
      setCookie(ctx, CookieNames.HAS_SESSION_COOKIE, Number(true).toString(), {
        path: "/",
        secure: true,
        sameSite: "strict",
        expires: session.expires,
      });
    },
  }
);
