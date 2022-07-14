import { Prisma } from "@prisma/client";
import { groupBy } from "lodash";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { ServerConstants } from "../../../constants";
import { OsuDroidScoreHelper } from "../../../database/helpers/OsuDroidScoreHelper";
import { SubmissionStatusUtils } from "../../../osu/droid/enum/SubmissionStatus";
import { createRouter, toApiEndpoint } from "../../createRouter";
import { requiredApplicationSecretMiddleware } from "../../middlewares";
import { shapeWithSecret } from "../../shapes";

const path = "cron-1-day";

// this should be run by a service such as easy cron
export const cron1DayRouter = createRouter().mutation(path, {
  meta: {
    openapi: { enabled: true, method: "PATCH", path: toApiEndpoint(path) },
  },
  input: z.object({
    ...shapeWithSecret,
  }),
  output: z.any(),
  async resolve({ input, ctx, type }) {
    await requiredApplicationSecretMiddleware({
      input,
      ctx,
      type,
      next: async () => {
        const scores = await prisma.osuDroidScore.findMany({
          where: {
            status: {
              // We only want to fetch scores which are user best so we can get the actual
              // leaderboard of the map after
              in: SubmissionStatusUtils.USER_BEST_STATUS,
            },
          },
          select: {
            id: true,
            mapHash: true,
            replay: true,
            [OsuDroidScoreHelper.getScoreLeaderboardMetricKey()]: true,
          },
          orderBy: {
            [OsuDroidScoreHelper.getScoreLeaderboardMetricKey()]:
              Prisma.SortOrder.desc,
          },
        });

        const groupedByMap = groupBy(scores, (o) => o.mapHash);

        const toDeleteReplayIDS: number[] = [];

        for (const key in groupedByMap) {
          const group = groupedByMap[key];

          // we remove the amount of scores that won't be checked for replay deletion from the group
          group.splice(0, ServerConstants.AMOUNT_SCORES_ON_SCORE_LEADERBOARD);

          // we only want to get the scores that still have replays that aren't on the leaderboard
          const selectedForDeletion = group.filter((s) => s.replay !== null);

          const forReplayDeletionIDs = selectedForDeletion.map((s) => s.id);

          toDeleteReplayIDS.push(...forReplayDeletionIDs);
        }

        await prisma.osuDroidScore.updateMany({
          where: {
            id: {
              in: toDeleteReplayIDS,
            },
          },
          data: {
            replay: null,
          },
        });
      },
    });
  },
});
