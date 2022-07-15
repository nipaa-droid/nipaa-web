import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { createRouter, toApiEndpoint } from "../../createRouter";
import { requiredApplicationSecretMiddleware } from "../../middlewares";
import { shapeWithSecret } from "../../shapes";

const path = "cron-1-hour";

export const cron1hourRouter = requiredApplicationSecretMiddleware(
  createRouter()
).mutation(path, {
  meta: {
    openapi: { enabled: true, method: "PATCH", path: toApiEndpoint(path) },
  },
  input: z.object({
    ...shapeWithSecret,
  }),
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
