import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { Responses } from "../../api/Responses";
import { assertDefined } from "../../assertions";
import { OsuDroidScoreHelper } from "../../database/helpers/OsuDroidScoreHelper";
import { BeatmapManager } from "../../database/managers/BeatmapManager";
import { HTTPMethod } from "../../http/HttpMethod";
import { SubmissionStatusUtils } from "../../osu_droid/enum/SubmissionStatus";
import { createRouter } from "../createRouter";
import {
  protectRouteWithAuthentication,
  protectRouteWithMethods,
} from "../middlewares";
import { schemaWithHash } from "../schemas";

export const getRankRouter = protectRouteWithAuthentication(
  protectRouteWithMethods(createRouter(), [HTTPMethod.POST])
).query("getrank", {
  input: schemaWithHash,
  async resolve({ input, ctx }) {
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
        [OsuDroidScoreHelper.getMetricKey()]: "desc" as Prisma.SortOrder,
      },
      take: 50,
      select: {
        id: true,
        maxCombo: true,
        grade: true,
        [OsuDroidScoreHelper.getMetricKey()]: true,
        h300: true,
        h100: true,
        h50: true,
        h0: true,
        hKatu: true,
        hGeki: true,
        mods: true,
        player: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!beatmap) {
      end();
      return;
    }

    scores.forEach((s) => {
      assertDefined(s.player);

      const accuracy = OsuDroidScoreHelper.getAccuracyDroid(s);

      responseScores.push(
        Responses.ARRAY(
          s.id.toString(),
          s.player.name,
          OsuDroidScoreHelper.getRoundedMetric(s).toString(),
          s.maxCombo.toString(),
          s.grade.toString(),
          s.mods,
          s.maxCombo.toString(),
          s.grade.toString(),
          accuracy.toString(),
          ctx.session.user.image
        )
      );
    });

    return end();
  },
});