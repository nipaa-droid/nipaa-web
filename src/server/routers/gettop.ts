import { createRouter } from "../createRouter";
import { z } from "zod";
import { Responses } from "../../api/Responses";
import { OsuDroidScoreHelper } from "../../database/helpers/OsuDroidScoreHelper";
import {
  protectRouteWithAuthentication,
  protectRouteWithMethods,
} from "../middlewares";
import { HTTPMethod } from "../../http/HttpMethod";
import { prisma } from "../../../lib/prisma";

export const getTopRouter = protectRouteWithAuthentication(
  protectRouteWithMethods(createRouter(), [HTTPMethod.POST])
).query("gettop", {
  input: z.object({
    playID: z.string(),
  }),
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
      OsuDroidScoreHelper.getRoundedMetric(score).toString(),
      score.maxCombo.toString(),
      score.grade.toString(),
      score.hGeki.toString(),
      score.h300.toString(),
      score.hKatu.toString(),
      score.h100.toString(),
      score.h50.toString(),
      score.h0.toString(),
      accuracy.toString(),
      score.date.getTime().toString(),
      Number(score.fc).toString(),
      score.player.name
    );
  },
});
