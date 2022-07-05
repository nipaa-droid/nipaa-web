import { Prisma } from "@prisma/client";
import { Responses } from "../../api/response/Responses";
import { assertDefined } from "../../assertions";
import { OsuDroidScoreHelper } from "../../database/helpers/OsuDroidScoreHelper";
import { BeatmapManager } from "../../database/managers/BeatmapManager";
import { HTTPMethod } from "../../http/HttpMethod";
import { NipaaModUtil } from "../../osu/NipaaModUtils";
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
        player: {
          select: {
            username: true,
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
          s.player.username,
          OsuDroidScoreHelper.getRoundedMetric(s).toString(),
          s.maxCombo.toString(),
          s.grade.toString(),
          NipaaModUtil.droidStringFromScore(s),
          s.maxCombo.toString(),
          s.grade.toString(),
          NipaaModUtil.droidStringFromScore(s),
          accuracy.toString(),
          ctx.session.user.image
        )
      );
    });

    return end();
  },
});
