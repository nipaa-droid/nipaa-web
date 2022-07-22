import { Prisma } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { Responses } from "../../../api/Responses";
import {
  OsuDroidScoreHelper,
  SCORE_LEADERBOARD_SCORE_METRIC_KEY,
} from "../../../database/helpers/OsuDroidScoreHelper";
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
import { ServerConstants } from "../../../constants";
import { protectedWithCookieBasedSessionMiddleware } from "../../middlewares";

const path = "getrank";

export const clientGetRankRouter = protectedWithCookieBasedSessionMiddleware(
  createRouter(),
  { id: true, expires: true }
).mutation(toApiClientTrpc(path), {
  meta: {
    openapi: {
      enabled: true,
      method: "POST",
      path: toApiEndpoint(path),
    },
  },
  input: z.object({ ...shapeWithHash }),
  output: z.string(),
  async resolve({ input, ctx }) {
    const { session } = ctx;
    const { hash } = input;

    const responseScores: string[] = [];

    OsuDroidUserHelper.refreshSession(session).then();

    const end = () => {
      return Responses.SUCCESS(responseScores.join("\n"));
    };

    const beatmap = await BeatmapManager.fetchBeatmap(hash);

    if (!beatmap) {
      return end();
    }

    const scores = await prisma.osuDroidScore.findMany({
      distinct: ["playerId"],
      where: {
        mapHash: hash,
        status: {
          in: SubmissionStatusUtils.USER_BEST_STATUS,
        },
      },
      orderBy: {
        [SCORE_LEADERBOARD_SCORE_METRIC_KEY]: Prisma.SortOrder.desc,
      },
      take: ServerConstants.AMOUNT_SCORES_ON_SCORE_LEADERBOARD,
      select: {
        [SCORE_LEADERBOARD_SCORE_METRIC_KEY]: true,
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
          OsuDroidUserHelper.getAvatarForClient(s.player.image)
        )
      );
    });

    return end();
  },
});
