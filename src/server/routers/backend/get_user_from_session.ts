import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { Responses } from "../../../api/Responses";
import { DatabaseSetup } from "../../../database/DatabaseSetup";
import { OsuDroidStatsHelper } from "../../../database/helpers/OsuDroidStatsHelper";
import { OsuDroidUserHelper } from "../../../database/helpers/OsuDroidUserHelper";
import { createRouter } from "../../createRouter";
import { TRPC_ERRORS } from "../../errors";
import { shapeWithSSID } from "../../shapes";

const output = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().or(z.null()),
  metric: z.number(),
});

export type ClientUserFromSession = z.infer<typeof output>;

export const trpcGetUserInformationFromSession = createRouter().query(
  "get-user-for-session",
  {
    input: z.object({
      ...shapeWithSSID,
    }),
    output,
    async resolve({ input }) {
      const { ssid } = input;

      const user = await prisma.osuDroidUser.findUnique({
        where: {
          session: ssid,
        },
        select: {
          id: true,
          name: true,
          image: true,
          stats: {
            where: {
              mode: DatabaseSetup.game_mode,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          message: Responses.USER_NOT_FOUND,
          code: "BAD_REQUEST",
        });
      }

      const statistic = OsuDroidUserHelper.getStatistic(
        user.stats,
        DatabaseSetup.game_mode
      );

      if (!statistic) {
        throw TRPC_ERRORS.UNAUTHORIZED;
      }

      const metric = await OsuDroidStatsHelper.getMetric(statistic);

      return {
        id: user.id.toString(),
        name: user.name,
        image: user.image,
        metric,
      };
    },
  }
);
