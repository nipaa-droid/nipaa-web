import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { Responses } from "../../../api/Responses";
import { OsuDroidUserHelper } from "../../../database/helpers/OsuDroidUserHelper";
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
    expires: true,
    user: {
      select: {
        id: true,
        playing: true,
      },
    },
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
    ...shapeWithSSID,
    ...shapeWithHash,
  }),
  output: z.string(),
  async resolve({ input, ctx }) {
    const { session } = ctx;
    const { user } = session;
    const { hash } = input;

    if (user.playing !== hash) {
      await prisma.osuDroidUser.update({
        where: {
          id: user.id,
        },
        data: {
          playing: hash,
          /**
           * Refreshes user session
           */
          sessions: {
            update: OsuDroidUserHelper.toRefreshSessionQuery(session),
          },
        },
      });
    }

    return Responses.SUCCESS(String(Number(true)), user.id.toString());
  },
});
