import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { Responses } from "../../../api/Responses";
import {
  createRouter,
  toApiEndpoint,
  toApiClientTrpc,
} from "../../createRouter";
import { protectedWithSessionMiddleware } from "../../middlewares";
import { shapeWithHash, shapeWithSSID } from "../../shapes";

const path = "play";

export const clientGetPlayRouter = protectedWithSessionMiddleware(
  createRouter(),
  {
    id: true,
    playing: true,
  }
).mutation(toApiClientTrpc(path), {
  meta: {
    openapi: {
      enabled: true,
      method: "POST",
      path: toApiEndpoint(path),
    },
  },
  input: z.object({
    ...shapeWithHash,
    ...shapeWithSSID,
    ...shapeWithHash,
  }),
  output: z.string(),
  async resolve({ input, ctx }) {
    const { user } = ctx;
    const { hash } = input;

    if (user.playing !== hash) {
      await prisma.osuDroidUser.update({
        where: {
          id: user.id,
        },
        data: {
          playing: hash,
        },
      });
    }

    return Responses.SUCCESS(String(Number(true)), user.id.toString());
  },
});
