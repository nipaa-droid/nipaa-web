import "core-js/actual/array/at";

import { NextApiResponse } from "next";
import { HTTPMethod } from "../../shared/http/HttpMethod";
import { NextApiRequestTypedBody } from "../../shared/api/query/NextApiRequestTypedBody";
import { RequestHandler } from "../../shared/api/request/RequestHandler";
import { DroidRequestValidator } from "../../shared/type/DroidRequestValidator";
import { HttpStatusCode } from "../../shared/http/HttpStatusCodes";
import { IHasHash } from "../../shared/api/query/IHasHash";
import { SubmissionStatusUtils } from "../../shared/osu_droid/enum/SubmissionStatus";
import { Responses } from "../../shared/api/response/Responses";
import { NipaaModUtil } from "../../shared/osu/NipaaModUtils";
import { assertDefined } from "../../shared/assertions";
import { BeatmapManager } from "../../shared/database/managers/BeatmapManager";
import assert from "assert";
import { OsuDroidScoreHelper } from "../../shared/database/helpers/OsuDroidScoreHelper";
import { Prisma } from "@prisma/client";

type body = IHasHash;

const validate = (body: Partial<body>): body is body => {
  return DroidRequestValidator.validateHash(body);
};

export default async function handler(
  req: NextApiRequestTypedBody<body>,
  res: NextApiResponse<string>
) {
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

  assert(hash);

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

  const beatmap = await BeatmapManager.fetchBeatmap(hash);

  const responseScores: string[] = [];

  const end = () => {
    res
      .status(HttpStatusCode.OK)
      .send(Responses.SUCCESS(responseScores.join("\n")));
  };

  if (!beatmap) {
    end();
    return;
  }

  scores.forEach((s) => {
    assertDefined(s.player);

    const accuracy = OsuDroidScoreHelper.getAccuracyDroidWithBeatmap(
      s,
      beatmap
    );

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
        "https://f4.bcbits.com/img/a1360862909_10.jpg" // TODO AVATAR
      )
    );
  });

  console.log(`Found ${scores.length} matching the criteria.`);

  end();
}
