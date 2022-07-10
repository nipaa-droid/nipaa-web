import { z } from "zod";
import { createRouter, toApiEndpoint } from "../../createRouter";
import { prisma } from "../../../../lib/prisma";
import { Responses } from "../../../api/Responses";

export const downloadReplayRouter = createRouter().query("get-replay", {
  meta: {
    openapi: {
      enabled: true,
      method: "GET",
      path: toApiEndpoint("upload/{replayID}"),
    },
  },
  input: z.object({
    replayID: z.string(),
  }),
  output: z.any(),
  async resolve({ input }) {
    const { replayID } = input;

    const score = await prisma.osuDroidScore.findUnique({
      where: {
        id: Number(replayID),
      },
      select: {
        replay: true,
      },
    });

    if (!score) {
      return Responses.FAILED(
        "Couldn't find the score for the replay file you are trying to find"
      );
    }

    const { replay } = score;

    if (!replay) {
      return Responses.FAILED(
        "Couldn't find the replay file for the score you provided"
      );
    }

    return replay;
  },
});
