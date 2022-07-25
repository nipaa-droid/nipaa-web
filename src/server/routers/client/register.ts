import { createRouter } from "../../createRouter";
import { prisma } from "../../../../lib/prisma";
import { TRPC_ERRORS } from "../../errors";
import bcrypt from "bcrypt";
import { AuthConstants } from "../../auth";
import { Responses } from "../../../api/Responses";
import { GameRules } from "../../../database/GameRules";
import { z, ZodObject } from "zod";
import { shapeWithAuthentication } from "../../shapes";

export const clientGetRegisterRouter = createRouter().mutation(
  "client-register",
  {
    meta: {
      openapi: {
        enabled: true,
        method: "POST",
        path: "/register",
      },
    },
    input: z.object({ ...shapeWithAuthentication }),
    output: z.string(),
    async resolve({ input }) {
      const { username, password, email } = input;
      return await clientRegisterResolver({
        username,
        password,
        email,
      });
    },
  }
);

export const clientRegisterResolver = async ({
  username,
  password,
  email,
}: z.infer<ZodObject<typeof shapeWithAuthentication>>) => {
  const existingUserByName = await prisma.osuDroidUser.findUnique({
    where: {
      name: username,
    },
    // we must select atleast something.
    select: {
      id: true,
    },
  });

  if (existingUserByName) {
    throw TRPC_ERRORS.UNAUTHORIZED;
  }

  const existingUserByEmail = await prisma.osuDroidUser.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });

  if (existingUserByEmail) {
    throw TRPC_ERRORS.UNAUTHORIZED;
  }

  const hashedPassword = await bcrypt.hash(password, AuthConstants.rounds);

  await prisma.osuDroidUser.create({
    data: {
      name: username.trim(),
      password: hashedPassword,
      email,
      stats: {
        create: [
          {
            mode: GameRules.game_mode,
            playCount: 0,
          },
        ],
      },
    },
    select: {
      id: true,
    },
  });

  return Responses.SUCCESS("Account created.");
};
