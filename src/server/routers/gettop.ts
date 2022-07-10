import { createRouter, toApiEndpoint } from "../createRouter";
import { z } from "zod";
import { Responses } from "../../api/Responses";
import { OsuDroidScoreHelper } from "../../database/helpers/OsuDroidScoreHelper";
import { prisma } from "../../../lib/prisma";

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

    return Responses.SUCCESS(
      score.mods,
      OsuDroidScoreHelper.getScoreLeaderboardMetric(score).toString(),
      score.maxCombo.toString(),
      OsuDroidScoreHelper.getGrade(score),
      score.hGeki.toString(),
      score.h300.toString(),
      score.hKatu.toString(),
      score.h100.toString(),
      score.h50.toString(),
      score.h0.toString(),
      accuracy.toString(),
      score.date.getTime().toString(),
      score.player.name
    );
  },
});
