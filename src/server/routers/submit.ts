import { OsuDroidStats } from "@prisma/client";
import { Responses } from "../../api/Responses";
import { DatabaseSetup } from "../../database/DatabaseSetup";
import {
  OsuDroidScoreHelper,
  isSubmissionScoreReturnError,
} from "../../database/helpers/OsuDroidScoreHelper";
import { OsuDroidStatsHelper } from "../../database/helpers/OsuDroidStatsHelper";
import { OsuDroidUserHelper } from "../../database/helpers/OsuDroidUserHelper";
import { SubmissionStatusUtils } from "../../osu_droid/enum/SubmissionStatus";
import { createRouter } from "../createRouter";
import { z } from "zod";
import { schemaWithID } from "../schemas";
import {
  protectRouteWithAuthentication,
  protectRouteWithMethods,
} from "../middlewares";
import { HTTPMethod } from "../../http/HttpMethod";
import { prisma } from "../../../lib/prisma";

const submissionPingInput = z
  .object({
    hash: z.string(),
  })
  .and(schemaWithID);

const submissionScoreInput = z
  .object({
    data: z.string(),
  })
  .and(schemaWithID);

export const submitRouter = protectRouteWithAuthentication(
  protectRouteWithMethods(createRouter(), [HTTPMethod.POST])
).mutation("submit", {
  input: submissionPingInput.or(submissionScoreInput),
  async resolve({ input, ctx }) {
    const { session } = ctx;

    const isSubmissionPing = await submissionPingInput.safeParseAsync(input);

    if (isSubmissionPing) {
      const parsedInput = await submissionPingInput.parseAsync(input);

      const { id, hash } = parsedInput;

      const user = await prisma.user.findUnique({
        where: {
          id: Number(id),
          email: session.user.email,
        },
        select: {
          playing: true,
        },
      });

      if (!user) {
        return Responses.FAILED(Responses.USER_NOT_FOUND);
      }

      if (user.playing !== hash) {
        await prisma.user.update({
          where: {
            id: Number(id),
          },
          data: {
            playing: hash,
          },
        });
      }

      return Responses.SUCCESS(String(Boolean(Number(true))), id.toString());
    } else {
      const parsedInput = await submissionScoreInput.parseAsync(input);

      const { data, id } = parsedInput;

      const user = await prisma.user.findUnique({
        where: {
          id: Number(id),
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
          userId: Number(id),
          playCount: s.playCount,
          mode: DatabaseSetup.game_mode,
        };
      });

      const scoreData = await OsuDroidScoreHelper.fromSubmission(data, {
        ...user,
        ...{ playing: user.playing },
      });

      if (isSubmissionScoreReturnError(scoreData)) {
        return fail(scoreData.error);
      }

      const { score } = scoreData;
      const { map } = scoreData;

      if (!OsuDroidScoreHelper.isBeatmapSubmittable(map)) {
        return Responses.FAILED("Beatmap not aproved.");
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
            grade: score.grade,
            mods: score.mods,
            fc: score.fc,
            status: score.status,
            playerId: score.playerId,
          },
        });
        extraResponse.push(sentScore.id.toString());
      }

      const statistic = OsuDroidUserHelper.getStatistic(statistics, score.mode);

      if (!statistic) {
        return fail("User statistics not found.");
      }

      OsuDroidUserHelper.submitScore(statistic, score);

      await prisma.osuDroidStats.update({
        where: {
          id: statistic.id,
        },
        data: {
          playCount: statistic.playCount,
        },
      });

      const userRank = await OsuDroidStatsHelper.getGlobalRank(statistic);
      const metric = await OsuDroidStatsHelper.getRoundedMetric(statistic);
      const accuracy = await OsuDroidStatsHelper.getAccuracy(statistic);
      const scoreRank = await OsuDroidScoreHelper.getPlacement(score);

      const response: string[] = [
        userRank.toString(),
        metric.toString(),
        accuracy.toString(),
        scoreRank.toString(),
        ...extraResponse,
      ];

      return Responses.SUCCESS(...response);
    }
  },
});
