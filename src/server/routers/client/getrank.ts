import { Prisma } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { Responses } from "../../../api/Responses";
import { OsuDroidScoreHelper } from "../../../database/helpers/OsuDroidScoreHelper";
import { OsuDroidUserHelper } from "../../../database/helpers/OsuDroidUserHelper";
import { BeatmapManager } from "../../../database/managers/BeatmapManager";
import { AccuracyUtils } from "../../../osu/droid/AccuracyUtils";
import { SubmissionStatusUtils } from "../../../osu/droid/enum/SubmissionStatus";
import {
  createRouter,
  toApiEndpoint,
  toApiClientTrpc,
} from "../../createRouter";
import { z } from "zod";
import { shapeWithHash } from "../../shapes";

const path = "getrank";

export const clientGetRankRouter = createRouter().mutation(
  toApiClientTrpc(path),
  {
    meta: {
      openapi: {
        enabled: true,
        method: "POST",
        path: toApiEndpoint(path),
      },
    },
    input: z.object({ ...shapeWithHash }),
    output: z.string(),
    async resolve({ input }) {
      const { hash } = input;

      const responseScores: string[] = [];

      const end = () => {
        return Responses.SUCCESS(responseScores.join("\n"));
      };

      const beatmap = await BeatmapManager.fetchBeatmap(hash);

      if (!beatmap) {
        return end();
      }

      const scores = await prisma.osuDroidScore.findMany({
        where: {
          mapHash: hash,
          status: {
            in: SubmissionStatusUtils.USER_BEST_STATUS,
          },
        },
        orderBy: {
          [OsuDroidScoreHelper.getScoreLeaderboardMetricKey()]:
            Prisma.SortOrder.desc,
        },
        take: 50,
        select: {
          [OsuDroidScoreHelper.getScoreLeaderboardMetricKey()]: true,
          id: true,
          maxCombo: true,
          h300: true,
          h100: true,
          h50: true,
          h0: true,
          mods: true,
          player: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      });

      if (!beatmap) {
        return end();
      }

      scores.forEach((s) => {
        const accPercent = OsuDroidScoreHelper.getAccuracyPercent(s);
        const accDroid = AccuracyUtils.acc100toDroid(accPercent);

        responseScores.push(
          Responses.ARRAY(
            s.id.toString(),
            s.player.name,
            Math.round(
              OsuDroidScoreHelper.getScoreLeaderboardMetric(s)
            ).toString(),
            s.maxCombo.toString(),
            OsuDroidScoreHelper.getGrade(s, { accuracy: accPercent }),
            s.mods,
            accDroid.toString(),
            OsuDroidUserHelper.getImage(s.player.image)
          )
        );
      });

      return end();
    },
  }
);