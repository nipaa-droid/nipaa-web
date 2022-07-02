import "reflect-metadata";
import "core-js/actual/array/at";

import { NextApiResponse } from "next";
import { HTTPMethod } from "../../shared/http/HttpMethod";
import { NextApiRequestTypedBody } from "../../shared/api/query/NextApiRequestTypedBody";
import { RequestHandler } from "../../shared/api/request/RequestHandler";
import { Database } from "../../shared/database/Database";
import { DroidRequestValidator } from "../../shared/type/DroidRequestValidator";
import { OsuDroidScore } from "../../shared/database/entities";
import { HttpStatusCode } from "../../shared/http/HttpStatusCodes";
import { IHasHash } from "../../shared/api/query/IHasHash";
import { SubmissionStatusUtils } from "../../shared/osu_droid/enum/SubmissionStatus";
import { Responses } from "../../shared/api/response/Responses";
import { NipaaModUtil } from "../../shared/osu/NipaaModUtils";
import { In } from "typeorm";
import { NonNullableKeys } from "../../shared/utils/TypeUtils";

type body = IHasHash;

const validate = (body: Partial<body>): body is body => {
  return DroidRequestValidator.validateHash(body);
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
  const { hash } = body;

  if (
    DroidRequestValidator.droidStringEndOnInvalidRequest(res, validate(body)) ||
    !validate(body)
  ) {
    return;
  }

  // TODO needs to fetch only player usernames
  const scores = (await OsuDroidScore.find({
    where: {
      mapHash: hash,
      status: In(SubmissionStatusUtils.USER_BEST_STATUS),
    },
    order: {
      [OsuDroidScore.metricKey()]: "DESC",
    },
    take: 50,
    relations: ["player"],
  })) as NonNullableKeys<OsuDroidScore, ["player"]>[];

  const responseScores = scores.map((s) => {
    return Responses.ARRAY(
      s.id.toString(),
      s.player.username,
      s.roundedMetric.toString(),
      s.maxCombo.toString(),
      s.grade.toString(),
      NipaaModUtil.droidStringFromScore(s),
      s.accuracyDroid.toString(),
      "https://f4.bcbits.com/img/a1360862909_10.jpg" // TODO AVATAR
    );
  });

  console.log(`Found ${scores.length} matching the criteria.`);

  res
    .status(HttpStatusCode.OK)
    .send(Responses.SUCCESS(responseScores.join("\n")));
}
