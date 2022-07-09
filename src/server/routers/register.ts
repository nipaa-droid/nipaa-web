import { createRouter } from "../createRouter";
import { prisma } from "../../../lib/prisma";
import { TRPC_ERRORS } from "../errors";
import bcrypt from "bcrypt";
import { AuthConstants } from "../auth";
import { protectRouteWithMethods } from "../middlewares";
import { HTTPMethod } from "../../http/HTTPMethod";
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
        OR: {
          email,
        },
      },
      // we must select atleast something.
      select: {
        id: true,
      },
    });

    if (existingUser.length > 0) {
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
      select: {
        id: true,
      },
    });

    return Responses.SUCCESS("Account created.");
  },
});
