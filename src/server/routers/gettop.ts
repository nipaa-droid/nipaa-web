import { createRouter, toApiEndpoint } from "../createRouter";
import { z } from "zod";
import { Responses } from "../../api/Responses";
import { OsuDroidScoreHelper } from "../../database/helpers/OsuDroidScoreHelper";
import { prisma } from "../../../lib/prisma";
import { BeatmapManager } from "../../database/managers/BeatmapManager";

const path = "gettop";

export const getTopRouter = createRouter().mutation(path, {
  meta: {
    openapi: { enabled: true, method: "POST", path: toApiEndpoint(path) },
  },
  input: z.object({
    playID: z.string(),
  }),
  output: z.string(),
  async resolve({ input }) {
    const { playID } = input;

    const score = await prisma.osuDroidScore.findUnique({
      where: {
        id: Number(playID),
      },
      include: {
        player: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!score || !score.player) {
      return Responses.FAILED("Score not found.");
    }

    const accuracy = OsuDroidScoreHelper.getAccuracyDroid(score);

    const map = await BeatmapManager.fetchBeatmap(score.mapHash);

    if (!map) {
      return Responses.FAILED("Couldn't retrieve beatmap for the score");
    }

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
