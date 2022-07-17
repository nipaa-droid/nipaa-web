import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { createRouter } from "../../createRouter";
import { shapeWithUsernameWithPassword } from "../../shapes";
import bcrypt from "bcrypt";
import { TRPC_ERRORS } from "../../errors";
import { OsuDroidUserHelper } from "../../../database/helpers/OsuDroidUserHelper";
import assert from "assert";
import { isCommonRequest } from "../../context";
import { setCookie } from "nookies";
import { CookieNames } from "../../../utils/cookies";

export const webLoginRouter = createRouter().mutation("web-login", {
  input: z.object({
    ...shapeWithUsernameWithPassword,
  }),
  async resolve({ input, ctx }) {
    assert(isCommonRequest(ctx));

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
    setCookie(ctx, CookieNames.SESSION_ID, session.id, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      expires: session.expires,
    });
  },
});
