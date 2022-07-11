import { z } from "zod";
import { createRouter } from "../../createRouter";
import { prisma } from "../../../../lib/prisma";
import { OsuDroidStatsHelper } from "../../../database/helpers/OsuDroidStatsHelper";
import { DatabaseSetup } from "../../../database/DatabaseSetup";
import { shapeWithUsername } from "../../shapes";
import { Metrics } from "../../../database/Metrics";
import { SubmissionStatusUtils } from "../../../osu/droid/enum/SubmissionStatus";

const output = z.array(
  z.object({
    userID: z.string(),
    metric: z.number(),
    ...shapeWithUsername,
  })
);

export const trpcGlobalLeaderboardRouter = createRouter().query(
  "global-leaderboard",
  {
    input: z.any(),
    output,
    async resolve() {
      const data: z.infer<typeof output> = [];

      switch (DatabaseSetup.global_leaderboard_metric as Metrics) {
        case Metrics.pp:
          const users = await prisma.osuDroidUser.findMany({
            select: {
              name: true,
              id: true,
              scores: {
                ...OsuDroidStatsHelper.getMetricToCalculateQueryWithoutStats(),
                select: {
                  pp: true,
                },
              },
            },
          });

          users.forEach((u) => {
            const { scores } = u;
            const performance =
              OsuDroidStatsHelper.getPerformanceFromScores(scores);
            data.push({
              userID: u.id.toString(),
              username: u.name,
              metric: performance,
            });
          });

          break;
        case Metrics.rankedScore:
        case Metrics.totalScore:
          const query = { ...OsuDroidStatsHelper.getTotalScoreRankQuery() };

          switch (DatabaseSetup.global_leaderboard_metric as Metrics) {
            case Metrics.rankedScore:
              query.where = {
                ...query.where,
                status: {
                  in: SubmissionStatusUtils.USER_BEST_STATUS,
                },
              };
          }

          const scoresGroupped = await prisma.osuDroidScore.groupBy(query);

          const usersForGrouppedScores = await prisma.osuDroidUser.findMany({
            where: {
              id: {
                in: scoresGroupped.map((s) => s.playerId),
              },
            },
            select: {
              name: true,
              id: true,
            },
          });

          usersForGrouppedScores.forEach((u) => {
            const totalScore = scoresGroupped
              .filter((s) => s.playerId === u.id)
              .map((s) => s.score)
              .reduce((acc, cur) => acc + cur, 0);

            data.push({
              username: u.name,
              userID: u.id.toString(),
              metric: totalScore,
            });
          });

          break;
      }

      return data;
    },
  }
);
