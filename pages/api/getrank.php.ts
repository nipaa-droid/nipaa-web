import "core-js/actual/array/at";

import { NextApiResponse } from "next";
import { HTTPMethod } from "../../src/http/HttpMethod";
import { NextApiRequestTypedBody } from "../../src/api/query/NextApiRequestTypedBody";
import { RequestHandler } from "../../src/api/request/RequestHandler";
import { DroidRequestValidator } from "../../src/type/DroidRequestValidator";
import { HttpStatusCode } from "../../src/http/HttpStatusCodes";
import { IHasHash } from "../../src/api/query/IHasHash";
import { SubmissionStatusUtils } from "../../src/osu_droid/enum/SubmissionStatus";
import { Responses } from "../../src/api/response/Responses";
import { NipaaModUtil } from "../../src/osu/NipaaModUtils";
import { assertDefined } from "../../src/assertions";
import { BeatmapManager } from "../../src/database/managers/BeatmapManager";
import assert from "assert";
import { OsuDroidScoreHelper } from "../../src/database/helpers/OsuDroidScoreHelper";
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
