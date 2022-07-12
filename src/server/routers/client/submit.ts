import { OsuDroidScore, OsuDroidStats } from "@prisma/client";
import { Responses } from "../../../api/Responses";
import { DatabaseSetup } from "../../../database/DatabaseSetup";
import {
  OsuDroidScoreHelper,
  isSubmissionScoreReturnError,
} from "../../../database/helpers/OsuDroidScoreHelper";
import {
  OsuDroidStatsBatchCalculate,
  OsuDroidStatsHelper,
} from "../../../database/helpers/OsuDroidStatsHelper";
import { OsuDroidUserHelper } from "../../../database/helpers/OsuDroidUserHelper";
import { SubmissionStatusUtils } from "../../../osu/droid/enum/SubmissionStatus";
import {
  createRouter,
  toApiEndpoint,
  toApiClientTrpc,
} from "../../createRouter";
import { z } from "zod";
import { shapeWithUserID } from "../../shapes";
import { AtLeast } from "../../../utils/types";
import { prisma } from "../../../../lib/prisma";

const path = "submit";

export const clientGetSubmitRouter = createRouter().mutation(
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
      data: z.string(),
      ...shapeWithUserID,
      ...shapeWithUserID,
    }),
    output: z.string(),
    async resolve({ input }) {
      const { data, userID } = input;

      const user = await prisma.osuDroidUser.findUnique({
        where: {
          id: Number(userID),
        },
        select: {
          id: true,
          name: true,
          playing: true,
          stats: {
            where: {
              mode: DatabaseSetup.game_mode,
            },
            select: {
              id: true,
              playCount: true,
            },
          },
        },
      });

      const fail = (reason: string) =>
        Responses.FAILED(`Failed to submit score. ${reason}`);

      if (!user) {
        return Responses.FAILED(Responses.USER_NOT_FOUND);
      }

      if (!user.playing) {
        return Responses.FAILED("User is not playing a map.");
      }

      const statistics: OsuDroidStats[] = user.stats.map((s) => {
        return {
          id: Number(s.id),
          userId: Number(user.id),
          playCount: s.playCount,
          mode: DatabaseSetup.game_mode,
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
        submitScore: AtLeast<OsuDroidScore, "mapHash">
      ) => {
        const scoreRank = await OsuDroidScoreHelper.getPlacement(submitScore);

        const { metric, accuracy } = await OsuDroidStatsHelper.batchCalculate(
          statistic,
          [
            OsuDroidStatsBatchCalculate.METRIC,
            OsuDroidStatsBatchCalculate.ACCURACY,
          ]
        );

        const userRank = await OsuDroidStatsHelper.getGlobalRank(
          user.id,
          metric
        );

        const response: string[] = [
          userRank.toString(),
          Math.round(metric).toString(),
          Math.round(accuracy).toString(),
          scoreRank.toString(),
          ...extraResponse,
        ];

        return Responses.SUCCESS(...response);
      };

      if (!OsuDroidScoreHelper.isBeatmapSubmittable(map)) {
        return await sendData(score);
      }

      const extraResponse: string[] = [];

      const canSubmit = SubmissionStatusUtils.isUserBest(score.status);

      if (canSubmit) {
        const sentScore = await prisma.osuDroidScore.create({
          data: {
            mode: score.mode,
            mapHash: score.mapHash,
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
            playerId: score.playerId,
          },
          select: {
            id: true,
            mapHash: true,
          },
        });

        extraResponse.push(sentScore.id.toString());

        OsuDroidUserHelper.submitScore(statistic, score);

        await prisma.osuDroidStats.update({
          where: {
            id: statistic.id,
          },
          data: {
            playCount: statistic.playCount,
          },
        });

        return await sendData(sentScore);
      }

      return await sendData(score);
    },
  }
);
