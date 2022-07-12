import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { Responses } from "../../../api/Responses";
import {
  createRouter,
  toApiEndpoint,
  toApiClientTrpc,
} from "../../createRouter";
import { shapeWithUserID, shapeWithHash, shapeWithSSID } from "../../shapes";

const path = "play";

export const clientGetPlayRouter = createRouter().mutation(
  toApiClientTrpc(path),
  {
    meta: {
      openapi: {
        enabled: true,
        method: "POST",
        path: toApiEndpoint(path),
      },
    },
    input: z.object({
      ...shapeWithUserID,
      ...shapeWithHash,
      ...shapeWithSSID,
      ...shapeWithHash,
    }),
    output: z.string(),
    async resolve({ input }) {
      const { hash, ssid, userID } = input;

      const whereUser: Prisma.OsuDroidUserWhereUniqueInput = {
        id: Number(userID),
      };

      const user = await prisma.osuDroidUser.findUnique({
        where: whereUser,
        select: {
          playing: true,
          session: true,
        },
      });

      if (!user) {
        return Responses.FAILED(Responses.USER_NOT_FOUND);
      }

      if (user.session != ssid) {
        return Responses.FAILED("Couldn't authenticate request");
      }

      if (user.playing !== hash) {
        await prisma.osuDroidUser.update({
          where: whereUser,
          data: {
            playing: hash,
          },
        });
      }

      return Responses.SUCCESS(String(Number(true)), userID.toString());
    },
  }
);
