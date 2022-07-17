import { z } from "zod";
import { createRouter } from "../../createRouter";
import { prisma } from "../../../../lib/prisma";
import { OsuDroidStatsHelper } from "../../../database/helpers/OsuDroidStatsHelper";
import { GameRules } from "../../../database/GameRules";
import { shapeWithSecret, shapeWithUsername } from "../../shapes";
import { GameMetrics } from "../../../database/GameMetrics";
import { SubmissionStatusUtils } from "../../../osu/droid/enum/SubmissionStatus";
import {
  OsuDroidScoreAccuracyCalculatable,
  OsuDroidScoreHelper,
} from "../../../database/helpers/OsuDroidScoreHelper";
import { ScoreGrade } from "../../../osu/ScoreGrade";
import { OsuDroidUserHelper } from "../../../database/helpers/OsuDroidUserHelper";
import { MustHave } from "../../../utils/types";
import { AccuracyUtils } from "../../../osu/droid/AccuracyUtils";
import { orderBy } from "lodash";
import { requiredApplicationSecretMiddleware } from "../../middlewares";

const output = z.array(
  z.object({
    userID: z.string(),
    metric: z.number(),
    accuracy: z.number(),
    playCount: z.number(),
    grades: z.object({
      SS: z.number(),
      S: z.number(),
      A: z.number(),
    }),
    ...shapeWithUsername,
  })
);

export type TRPCGlobalLeaderboardReturnType = z.infer<typeof output>;

const path = "web-global-leaderboard";

export const trpcGlobalLeaderboardRouter = requiredApplicationSecretMiddleware(
  createRouter()
).query(path, {
  input: z.object({ ...shapeWithSecret }),
  output,
  async resolve() {
    const data: z.infer<typeof output> = [];

    const getGradesObject = (
      scores: MustHave<OsuDroidScoreAccuracyCalculatable, "mods">[]
    ) => {
      const grades = scores.map((s) => OsuDroidScoreHelper.getGrade(s));

      const gradesData: typeof data[number]["grades"] = {
        SS: 0,
        S: 0,
        A: 0,
      };

      grades.forEach((g) => {
        switch (g) {
          case ScoreGrade.X:
          case ScoreGrade.XH:
            gradesData.SS++;
            break;
          case ScoreGrade.S:
          case ScoreGrade.SH:
            gradesData.S++;
            break;
          case ScoreGrade.A:
            gradesData.A++;
            break;
        }
      });

      return gradesData;
    };

    switch (GameRules.global_leaderboard_metric as GameMetrics) {
      case GameMetrics.pp:
        const users = await prisma.osuDroidUser.findMany({
          select: {
            name: true,
            id: true,
            stats: {
              select: {
                playCount: true,
                mode: true,
              },
            },
            scores: {
              where: {
                status: {
                  in: SubmissionStatusUtils.USER_BEST_STATUS,
                },
              },
              select: OsuDroidScoreHelper.toGradeableSelect({
                pp: true,
              }),
            },
          },
        });

        users.forEach((u) => {
          const { scores, stats } = u;

          const statistic = OsuDroidUserHelper.getStatistic(
            stats,
            GameRules.game_mode
          );

          if (!statistic) {
            return;
          }

          const { playCount } = statistic;

          const performance =
            OsuDroidStatsHelper.getPerformanceFromScores(scores);

          const accuracy = AccuracyUtils.accDroidToAcc100(
            OsuDroidStatsHelper.getAccuracyFromScores(scores)
          );

          const grades = getGradesObject(scores);

          data.push({
            userID: u.id.toString(),
            username: u.name,
            accuracy,
            playCount,
            metric: performance,
            grades,
          });
        });

        break;
      case GameMetrics.rankedScore:
      case GameMetrics.totalScore:
        const query = OsuDroidStatsHelper.toTotalScoreRankQuery({});

        switch (GameRules.global_leaderboard_metric as GameMetrics) {
          case GameMetrics.rankedScore:
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
            stats: {
              select: {
                playCount: true,
                mode: true,
              },
            },
          },
        });

        usersForGrouppedScores.forEach((u) => {
          const statistic = OsuDroidUserHelper.getStatistic(
            u.stats,
            GameRules.game_mode
          );

          if (!statistic) {
            return;
          }

          const userScores = scoresGroupped.filter((s) => s.playerId === u.id);

          const totalScore = userScores
            .map((s) => s.score)
            .reduce((acc, cur) => acc + cur, 0);

          const accuracy = AccuracyUtils.acc100toDroid(
            OsuDroidStatsHelper.getAccuracyFromScores(userScores)
          );

          const { playCount } = statistic;

          data.push({
            username: u.name,
            userID: u.id.toString(),
            playCount,
            accuracy,
            metric: totalScore,
            grades: getGradesObject(userScores),
          });
        });

        break;
    }

    return orderBy(data, (o) => o.metric, "desc");
  },
});
