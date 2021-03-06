import { createRouter } from "../../createRouter";
import { z } from "zod";
import { Responses } from "../../../api/Responses";
import {
  OsuDroidScoreHelper,
  SCORE_LEADERBOARD_SCORE_METRIC_KEY,
} from "../../../database/helpers/OsuDroidScoreHelper";
import { prisma } from "../../../../lib/prisma";
import { BeatmapManager } from "../../../database/managers/BeatmapManager";
import { protectedWithCookieBasedSessionMiddleware } from "../../middlewares";
import { OsuDroidUserHelper } from "../../../database/helpers/OsuDroidUserHelper";

export const clientGetTopRouter = protectedWithCookieBasedSessionMiddleware(
  createRouter(),
  { id: true, expires: true }
).mutation("client-gettop", {
  meta: {
    openapi: {
      enabled: true,
      method: "POST",
      path: "/gettop",
    },
  },
  input: z.object({
    playID: z.string(),
  }),
  output: z.string(),
  async resolve({ input, ctx }) {
    const { session } = ctx;
    const { playID } = input;

    OsuDroidUserHelper.refreshSession(session).then();

    const score = await prisma.osuDroidScore.findUnique({
      where: {
        id: Number(playID),
      },
      select: OsuDroidScoreHelper.toGradeableSelect({
        player: {
          select: {
            name: true,
          },
        },
        score: true,
        maxCombo: true,
        date: true,
        hGeki: true,
        hKatu: true,
        [SCORE_LEADERBOARD_SCORE_METRIC_KEY]: true,
        beatmap: {
          select: {
            hash: true,
          },
        },
      }),
    });

    if (!score || !score.player) {
      return Responses.FAILED("Score not found.");
    }

    const map = await BeatmapManager.fetchBeatmap(score.beatmap!.hash);

    if (!map) {
      return Responses.FAILED("Couldn't retrieve beatmap for the score");
    }

    const accuracy = OsuDroidScoreHelper.getAccuracyDroid(score);

    return Responses.SUCCESS(
      score.mods,
      Math.round(
        OsuDroidScoreHelper.getScoreLeaderboardMetric(score)
      ).toString(),
      score.maxCombo.toString(),
      OsuDroidScoreHelper.getGrade(score),
      score.hGeki.toString(),
      score.h300.toString(),
      score.hKatu.toString(),
      score.h100.toString(),
      score.h50.toString(),
      score.h0.toString(),
      Math.round(accuracy).toString(),
      score.date.getTime().toString(),
      Number(map.maxCombo === score.maxCombo).toString(),
      score.player.name
    );
  },
});
