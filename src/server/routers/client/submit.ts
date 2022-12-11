import { OsuDroidScore, OsuDroidStats } from "@prisma/client";
import { GameRules } from "../../../database/GameRules";
import {
  isSubmissionScoreReturnError,
  OsuDroidScoreHelper,
  SCORE_LEADERBOARD_SCORE_METRIC_KEY,
} from "../../../database/helpers/OsuDroidScoreHelper";
import { OsuDroidStatsBatchCalculate, OsuDroidStatsHelper, } from "../../../database/helpers/OsuDroidStatsHelper";
import { OsuDroidUserHelper } from "../../../database/helpers/OsuDroidUserHelper";
import { SubmissionStatusUtils } from "../../../osu/droid/enum/SubmissionStatus";
import { createRouter, toApiClientTrpc, toApiEndpoint, } from "../../createRouter";
import { z } from "zod";
import { shapeWithUserID } from "../../shapes";
import { AtLeast } from "../../../utils/types";
import { prisma } from "../../../../lib/prisma";
import { protectedWithCookieBasedSessionMiddleware } from "../../middlewares";
import { responses } from "../../responses";

const path = "submit";

export const clientGetSubmitRouter = protectedWithCookieBasedSessionMiddleware(
  createRouter(),
  {
    id: true,
    expires: true,
    user: {
      select: {
        id: true,
        name: true,
        playing: true,
        stats: {
          where: {
            mode: GameRules.game_mode,
          },
          select: {
            id: true,
            playCount: true,
          },
        },
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
    data: z.string(),
    ...shapeWithUserID,
  }),
  output: z.string(),
  async resolve({ input, ctx }) {
    const { session } = ctx;
    const { user } = session;
    const { data } = input;
    
    const fail = (reason: string) => responses.no(`Failed to submit score. ${reason}`);
    
    if (!user) {
      return responses.user404;
    }
    
    if (!user.playing) {
      return responses.no("User is not playing a map.");
    }
    
    const statistics: OsuDroidStats[] = user.stats.map((s) => {
      return {
        id: Number(s.id),
        userId: Number(user.id),
        playCount: s.playCount,
        mode: GameRules.game_mode,
      };
    });
    
    const scoreData = await OsuDroidScoreHelper.fromSubmission(data, {
      ...user,
      playing: user.playing,
    });
    
    if (isSubmissionScoreReturnError(scoreData)) {
      return fail(scoreData.error);
    }
    
    const { score } = scoreData;
    const { map } = scoreData;
    
    const statistic = OsuDroidUserHelper.getStatistic(statistics, score.mode);
    
    if (!statistic) {
      return fail("User statistics not found.");
    }
    
    const sendData = async (
      submitScore: AtLeast<
        OsuDroidScore,
        typeof SCORE_LEADERBOARD_SCORE_METRIC_KEY
      >
    ) => {
      const scoreRank = await OsuDroidScoreHelper.getPlacement(
        submitScore,
        map.hash
      );
      
      const { metric, accuracy } = await OsuDroidStatsHelper.batchCalculate(
        statistic,
        [
          OsuDroidStatsBatchCalculate.METRIC,
          OsuDroidStatsBatchCalculate.ACCURACY,
        ]
      );
      
      const userRank = await OsuDroidStatsHelper.getGlobalRank(user.id, metric);
      
      const response: string[] = [
        userRank.toString(),
        Math.round(metric).toString(),
        Math.round(accuracy).toString(),
        scoreRank.toString(),
        ...extraResponse,
      ];
      
      return responses.ok(...response);
    };
    
    if (!OsuDroidScoreHelper.isBeatmapSubmittable(map)) {
      return await sendData(score);
    }
    
    const extraResponse: string[] = [];
    
    const canSubmit = SubmissionStatusUtils.isUserBest(score.status);
    
    if (canSubmit) {
      const [sentScore] = await prisma.$transaction([
        prisma.osuDroidScore.create({
          data: {
            mode: score.mode,
            pp: score.pp,
            score: score.score,
            h300: score.h300,
            h100: score.h100,
            h50: score.h50,
            h0: score.h0,
            hGeki: score.hGeki,
            hKatu: score.hKatu,
            maxCombo: score.maxCombo,
            mods: score.mods,
            status: score.status,
            player: {
              connect: {
                id: score.playerId,
              },
            },
            beatmap: {
              connectOrCreate: {
                where: {
                  hash: map.hash,
                },
                create: {
                  hash: map.hash,
                },
              },
            },
          },
          select: {
            id: true,
            [SCORE_LEADERBOARD_SCORE_METRIC_KEY]: true,
          },
        }),
        prisma.osuDroidUser.update({
          where: {
            id: user.id,
          },
          data: {
            playing: null,
            sessions: {
              update: OsuDroidUserHelper.toRefreshSessionQuery(session),
            },
            stats: {
              update: {
                where: {
                  id: statistic.id,
                },
                data: {
                  playCount: ++statistic.playCount,
                },
              },
            },
          },
          select: {
            id: true,
          },
        }),
      ]);
      
      return await sendData(sentScore);
    }
    
    return await sendData(score);
  },
});
