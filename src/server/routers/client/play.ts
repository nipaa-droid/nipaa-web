import { OsuDroidUser, UserSession } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { Responses } from "../../../api/Responses";
import { OsuDroidUserHelper } from "../../../database/helpers/OsuDroidUserHelper";
import { AtLeast, MinimalAtLeast } from "../../../utils/types";
import { createRouter } from "../../createRouter";
import { protectedWithCookieBasedSessionMiddleware } from "../../middlewares";
import { shapeWithHash } from "../../shapes";

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
).mutation("client-play", {
  meta: {
    openapi: {
      enabled: true,
      method: "POST",
      path: "/play",
    },
  },
  input: z.object({
    ...shapeWithHash,
  }),
  output: z.string(),
  async resolve({ input, ctx }) {
    const { session } = ctx;
    const { hash } = input;
    const { user } = session;
    return await clientPlayResolver({
      session,
      user,
      hash,
    });
  },
});

export type ClientPlaySession = AtLeast<UserSession, "id" | "expires">;

export type ClientPlayUser = MinimalAtLeast<OsuDroidUser, "id" | "playing">;

export const clientPlayResolver = async ({
  session,
  user,
  hash,
}: {
  session: ClientPlaySession;
  user: ClientPlayUser;
  hash: string;
}) => {
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
};
