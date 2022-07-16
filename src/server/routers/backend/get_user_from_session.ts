import { z } from "zod";
import { GameRules } from "../../../database/GameRules";
import { OsuDroidStatsHelper } from "../../../database/helpers/OsuDroidStatsHelper";
import { OsuDroidUserHelper } from "../../../database/helpers/OsuDroidUserHelper";
import { createRouter } from "../../createRouter";
import { TRPC_ERRORS } from "../../errors";
import { protectedWithCookieBasedSessionMiddleware } from "../../middlewares";

const output = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().or(z.null()),
  metric: z.number(),
});

export type ClientUserFromSession = z.infer<typeof output>;

export const webGetUserInformationFromSession =
  protectedWithCookieBasedSessionMiddleware(createRouter(), {
    user: {
      select: {
        id: true,
        name: true,
        image: true,
        stats: {
          where: {
            mode: GameRules.game_mode,
          },
        },
      },
    },
  }).query("get-user-for-session", {
    input: z.any(),
    output,
    async resolve({ ctx }) {
      const { session } = ctx;
      const { user } = session;

      const statistic = OsuDroidUserHelper.getStatistic(
        user.stats,
        GameRules.game_mode
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
  });
