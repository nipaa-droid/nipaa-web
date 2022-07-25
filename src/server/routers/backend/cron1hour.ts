import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { createRouter } from "../../createRouter";
import { requiredApplicationSecretMiddleware } from "../../middlewares";
import { shapeWithSecret } from "../../shapes";

export const cron1hourRouter = requiredApplicationSecretMiddleware(
  createRouter()
).mutation("backend-cron-1-hour", {
  meta: {
    openapi: { enabled: true, method: "PATCH", path: "/cron-1-hour" },
  },
  input: z.object({
    ...shapeWithSecret,
  }),
  output: z.any(),
  async resolve() {
    // Deletes expired sessions
    await prisma.userSession.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });
  },
});
