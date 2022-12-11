import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { OsuDroidUserHelper } from "../../../database/helpers/OsuDroidUserHelper";
import { createRouter, toApiClientTrpc, toApiEndpoint, } from "../../createRouter";
import { protectedWithCookieBasedSessionMiddleware } from "../../middlewares";
import { shapeWithHash } from "../../shapes";
import { responses } from "../../responses";

const path = "play";

export const clientGetPlayRouter = protectedWithCookieBasedSessionMiddleware(
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
    
    return responses.ok(String(Number(true)), user.id.toString());
  },
});
