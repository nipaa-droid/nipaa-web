import { createRouter } from "../createRouter";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { TRPC_ERRORS } from "../errors";
import bcrypt from "bcrypt";
import { AuthConstants } from "../auth";
import { protectRouteWithMethods } from "../middlewares";
import { HTTPMethod } from "../../http/HttpMethod";
import { Responses } from "../../api/Responses";
import { DatabaseSetup } from "../../database/DatabaseSetup";
import { schemaWithAuth } from "../schemas";

export const registerRouter = protectRouteWithMethods(createRouter(), [
  HTTPMethod.POST,
]).mutation("register", {
  input: schemaWithAuth,
  async resolve({ input }) {
    const { username, password, email } = input;

    const existingUser = await prisma.osuDroidUser.findMany({
      where: {
        name: username,
        email,
      },
      select: {},
    });

    if (existingUser) {
      throw TRPC_ERRORS.UNAUTHORIZED;
    }

    const hashedPassword = await bcrypt.hash(password, AuthConstants.rounds);

    await prisma.osuDroidUser.create({
      data: {
        name: username,
        password: hashedPassword,
        stats: {
          create: [
            {
              mode: DatabaseSetup.game_mode,
              playCount: 0,
            },
          ],
        },
      },
    });

    return Responses.SUCCESS("Account created.");
  },
});
