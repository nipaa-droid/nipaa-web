import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { createRouter } from "../../createRouter";
import { protectedWithSessionMiddleware } from "../../middlewares";
import { shapeWithSSID } from "../../shapes";

export const webLogoutRouter = protectedWithSessionMiddleware(createRouter(), {
  id: true,
}).mutation("web-logout", {
  input: z.object({
    ...shapeWithSSID,
  }),
  async resolve({ ctx }) {
    const { session } = ctx;
    await prisma.userSession.delete({
      where: {
        id: session.id,
      },
    });
  },
});
