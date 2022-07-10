import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { Responses } from "../../../api/Responses";
import { HTTPMethod } from "../../../http/HTTPMethod";

const schema = z.object({
  file: z.string(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== HTTPMethod.GET) {
    return;
  }

  const { query } = req;

  const validated = await schema.safeParseAsync(query);

  if (!validated.success) {
    return Responses.FAILED(Responses.INVALID_REQUEST_BODY);
  }

  const { file } = await schema.parseAsync(query);

  const replayID = file.split(".")[0];

  if (!replayID) {
    return Responses.FAILED("Invalid replay id provided");
  }

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

  res.setHeader("Content-Type", "application/octet-stream");
  res.send(replay);
}
