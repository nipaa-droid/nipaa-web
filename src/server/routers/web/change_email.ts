import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { OsuDroidUserHelper } from "../../../database/helpers/OsuDroidUserHelper";
import { createRouter } from "../../createRouter";
import { TRPC_ERRORS } from "../../errors";
import { protectedWithCookieBasedSessionMiddleware } from "../../middlewares";
import { shapeWithConfirmationPassword, shapeWithEmail } from "../../shapes";

export const changeEmailSchema = z.object({
  ...shapeWithConfirmationPassword,
  ...shapeWithEmail,
});

export const changeEmailRouter = protectedWithCookieBasedSessionMiddleware(
  createRouter(),
  { id: true, user: { select: { id: true, password: true, email: true } } }
).mutation("change-email", {
  input: changeEmailSchema,
  output: z.any(),
  async resolve({ input, ctx }) {
    const { session } = ctx;
    const { user } = session;
    const { confirmationPassword, email } = input;
    
    if (email === user.email) {
      throw TRPC_ERRORS.UNAUTHORIZED;
    }
    
    const validatedPassword = await OsuDroidUserHelper.validatePassword(
      confirmationPassword,
      user.password
    );
    
    if (!validatedPassword) {
      throw TRPC_ERRORS.UNAUTHORIZED;
    }
    
    const foundUser = await prisma.osuDroidUser.findUnique({
      where: {
        email,
      },
    });
    
    if (foundUser) {
      throw TRPC_ERRORS.UNAUTHORIZED;
    }
    
    await prisma.osuDroidUser.update({
      where: {
        id: user.id,
      },
      data: {
        email,
      },
    });
  },
});
