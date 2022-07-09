import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { Responses } from "../../api/Responses";
import { OsuDroidScoreHelper } from "../../database/helpers/OsuDroidScoreHelper";
import { OsuDroidUserHelper } from "../../database/helpers/OsuDroidUserHelper";
import { BeatmapManager } from "../../database/managers/BeatmapManager";
import { HTTPMethod } from "../../http/HttpMethod";
import { SubmissionStatusUtils } from "../../osu_droid/enum/SubmissionStatus";
import { createRouter } from "../createRouter";
import { protectRouteWithMethods } from "../middlewares";
import { schemaWithHash } from "../schemas";

export const getRankRouter = protectRouteWithMethods(createRouter(), [
  HTTPMethod.POST,
]).mutation("getrank", {
  input: schemaWithHash,
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
        grade: true,
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
      const accuracy = OsuDroidScoreHelper.getAccuracyDroid(s);

      responseScores.push(
        Responses.ARRAY(
          s.id.toString(),
          s.player.name,
          OsuDroidScoreHelper.getScoreLeaderboardMetric(s).toString(),
          s.maxCombo.toString(),
          s.grade.toString(),
          s.mods,
          accuracy.toString(),
          OsuDroidUserHelper.getImage(s.player.image)
        )
      );
    });

    return end();
  },
});
