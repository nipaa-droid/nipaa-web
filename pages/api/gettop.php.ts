import "reflect-metadata";
import "core-js/actual/array/at";

import { NextApiResponse } from "next";
import { NextApiRequestTypedBody } from "../../shared/api/query/NextApiRequestTypedBody";
import { Database } from "../../shared/database/Database";
import { DroidRequestValidator } from "../../shared/type/DroidRequestValidator";
import { HttpStatusCode } from "../../shared/http/HttpStatusCodes";
import { Responses } from "../../shared/api/response/Responses";
import { NipaaModUtil } from "../../shared/osu/NipaaModUtils";
import { assertDefined } from "../../shared/assertions";
import { RequestHandler } from "../../shared/api/request/RequestHandler";
import { HTTPMethod } from "../../shared/http/HttpMethod";
import { OsuDroidScoreHelper } from "../../shared/database/helpers/OsuDroidScoreHelper";

type body = { playID: string };

const validate = (body: Partial<body>): body is body => {
  return typeof body.playID === "string";
};

export default async function handler(
  req: NextApiRequestTypedBody<body>,
  res: NextApiResponse<string>
) {
  await Database.getConnection();

  if (RequestHandler.endWhenInvalidHttpMethod(req, res, HTTPMethod.POST)) {
    return;
  }

  const { body } = req;
  const { playID } = body;

  if (
    DroidRequestValidator.droidStringEndOnInvalidRequest(res, validate(body)) ||
    !validate(body)
  ) {
    return;
  }

  const score = await prisma.osuDroidScore.findUnique({
    where: {
      id: Number(playID),
    },
    include: {
      player: {
        select: {
          username: true,
        },
      },
    },
  });

  if (!score) {
    res.status(HttpStatusCode.BAD_REQUEST).send("Score not found.");
    return;
  }

  assertDefined(score.player);

  const accuracy = await OsuDroidScoreHelper.getAccuracyDroid(score);

  res
    .status(HttpStatusCode.OK)
    .send(
      Responses.SUCCESS(
        NipaaModUtil.droidStringFromScore(score),
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
        score.player.username
      )
    );
}
