import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { createRouter } from "../../createRouter";
import { shapeWithUsernameWithPassword } from "../../shapes";
import bcrypt from "bcrypt";
import { TRPC_ERRORS } from "../../errors";
import { OsuDroidUserHelper } from "../../../database/helpers/OsuDroidUserHelper";
import assert from "assert";
import { isCommonRequest } from "../../context";

export const trpcLoginRouter = createRouter().mutation("login", {
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
        session: true,
        password: true,
      },
    });

    if (!user) {
      throw TRPC_ERRORS.UNAUTHORIZED;
    }

    const authorized = bcrypt.compare(password, user.password);

    if (!authorized) {
      throw TRPC_ERRORS.UNAUTHORIZED;
    }

    const session = await OsuDroidUserHelper.createSession(
      user.session,
      user.id
    );

    return {
      session,
    };
  },
});
