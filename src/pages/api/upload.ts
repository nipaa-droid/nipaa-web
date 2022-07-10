import { z } from "zod";
import { Responses } from "../../api/Responses";
import { HTTPMethod } from "../../http/HTTPMethod";
import { HTTPStatusCode } from "../../http/HTTPStatusCodes";
import { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm } from "formidable";
import { differenceInSeconds } from "date-fns";
import { prisma } from "../../../lib/prisma";
import { SubmissionStatusUtils } from "../../osu/droid/enum/SubmissionStatus";
import { BeatmapManager } from "../../database/managers/BeatmapManager";
import fs from "fs/promises";
import { OsuDroidScoreHelper } from "../../database/helpers/OsuDroidScoreHelper";
import { Prisma } from "@prisma/client";
import { Accuracy, MapInfo, MapStats, Precision } from "@rian8337/osu-base";
import { ReplayAnalyzer } from "@rian8337/osu-droid-replay-analyzer";
import {
  BeatmapReplayAnalyzerWithData,
  ReplayAnalyzerUtils,
} from "../../osu/droid/ReplayAnalyzerUtils";
import { OsuModUtils } from "../../osu/OsuModUtils";
import { LATEST_REPLAY_VERSION } from "../../osu/droid/enum/ReplayVersions";
import { AccuracyUtils } from "../../osu/droid/AccuracyUtils";
import mean from "lodash.mean";
import {
  DroidPerformanceCalculator,
  DroidStarRating,
} from "@rian8337/osu-difficulty-calculator";

const schema = z.object({
  fields: z.object({
    replayID: z.string(),
  }),
  files: z.object({
    uploadedfile: z.object({
      originalFilename: z.string(),
      lastModifiedDate: z.date(),
      filepath: z.string(),
    }),
  }),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== HTTPMethod.POST) {
    return;
  }

  const formData = await new Promise(function (resolve, reject) {
    const form = new IncomingForm({ keepExtensions: true });
    form.parse(req, function (err, fields, files) {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });

  console.log(formData);

  const verified = await schema.safeParseAsync(formData);

  if (!verified.success) {
    res
      .status(HTTPStatusCode.BAD_REQUEST)
      .send(Responses.FAILED(Responses.INVALID_REQUEST_BODY));
    return;
  }

  const { fields, files } = await schema.parseAsync(formData);
  const replayID = Number(fields.replayID);
  const { uploadedfile: uploadedfile } = files;

  const dateNow = new Date();

  const verifyDate = async (
    dateToCompare: Date,
    name: string,
    MAXIMUM_SECONDS_DIFFERENCE = 10
  ) => {
    const differenceToUpload = differenceInSeconds(dateNow, dateToCompare);

    console.log(`Date compare: ${name}`);
    console.log(
      `User took ${differenceToUpload} seconds to upload the replay.`
    );
    console.log("-".repeat(10));

    if (differenceToUpload >= MAXIMUM_SECONDS_DIFFERENCE) {
      console.log("Suspiciously long wait time to upload score replay.");
      res
        .status(HTTPStatusCode.BAD_REQUEST)
        .send(Responses.FAILED("Took too long to upload replay file."));

      return false;
    }

    return true;
  };

  const verifyFileDate = await verifyDate(
    uploadedfile.lastModifiedDate,
    "FILE"
  );

  if (!verifyFileDate) return;

  const score = await prisma.osuDroidScore.findUnique({
    where: {
      id: replayID,
    },
    include: {
      player: true,
    },
  });

  if (!score) {
    console.log("Score not found.");
    res
      .status(HTTPStatusCode.BAD_REQUEST)
      .send(Responses.FAILED("Failed to find score to upload replay."));
    return;
  }

  if (!SubmissionStatusUtils.isUserBest(score.status)) {
    console.log("Not a best score.");
    res
      .status(HTTPStatusCode.BAD_REQUEST)
      .send(
        Responses.FAILED(
          "The uploaded score isn't the best score from the user on that beatmap."
        )
      );
    return;
  }

  let rawReplay: Buffer | undefined = undefined;

  const loadRawReplay = async () => {
    return await fs.readFile(uploadedfile.filepath);
  };

  const removeScore = async (mapInfo: MapInfo | undefined) => {
    await prisma.osuDroidScore.delete({
      where: {
        id: score.id,
      },
    });

    const userBest = await prisma.osuDroidScore.findFirst({
      where: {
        playerId: score.playerId,
        mapHash: score.mapHash,
      },
      orderBy: {
        [OsuDroidScoreHelper.getGlobalLeaderboardMetricKey()]:
          Prisma.SortOrder.desc,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (userBest) {
      if (SubmissionStatusUtils.isUserBest(userBest.status)) {
        throw "Unexpected. why would a previous score have a submission status of best, fix.";
      } else if (mapInfo) {
        OsuDroidScoreHelper.changeStatusToApproved(userBest, mapInfo);
        await prisma.osuDroidScore.update({
          where: {
            id: userBest.id,
          },
          data: {
            status: userBest.status,
          },
        });
      }
    }
  };

  const invalidateReplay = async () => {
    console.log("Suspicious replay file.");

    await removeScore(undefined);

    res
      .status(HTTPStatusCode.BAD_REQUEST)
      .send("Couldn't validate replay integrity.");
    return;
  };

  const mapInfo = await BeatmapManager.fetchBeatmap(score.mapHash);

  if (!mapInfo || !mapInfo.map) {
    await invalidateReplay();
    return res
      .status(HTTPStatusCode.BAD_REQUEST)
      .send(Responses.FAILED("Map not found."));
  }

  if (score.replay) {
    console.log("Suspicious, replay is already uploaded.");
    res
      .status(HTTPStatusCode.BAD_REQUEST)
      .send(Responses.FAILED("Score already has a replay."));
    return;
  }

  const verifyUserSubmittedDate = verifyDate(score.date, "SCORE");

  if (!verifyUserSubmittedDate) {
    await removeScore(mapInfo);
    return;
  }

  const ADDITIONAL_CHECK_STRING = "PK";

  rawReplay = await loadRawReplay();

  if (!rawReplay) {
    res
      .status(HTTPStatusCode.BAD_REQUEST)
      .send(Responses.FAILED("Couldn't load raw replay file"));
    return;
  }

  const replayString = rawReplay.toString();

  if (!replayString.startsWith(ADDITIONAL_CHECK_STRING)) {
    res
      .status(HTTPStatusCode.BAD_REQUEST)
      .send(Responses.FAILED("Failed to check validity of replay."));
    return;
  }

  const replay = new ReplayAnalyzer({
    scoreID: score.id,
    map: mapInfo.map,
  });

  replay.originalODR = rawReplay;

  await replay.analyze();

  if (!replay || !replay.data) {
    await invalidateReplay();
    return;
  }

  const { data: replayData } = replay;

  /**
   * We then estimate the score for double checking.
   */
  const estimatedScore = ReplayAnalyzerUtils.estimateScore(
    replay as BeatmapReplayAnalyzerWithData
  );

  /**
   * We are less harsher with date for replays intentionally.
   */
  const verifiedReplayInputDate = await verifyDate(
    replayData.time,
    "REPLAY",
    60
  );

  if (!verifiedReplayInputDate) {
    await removeScore(mapInfo);
  }

  const { mods: scoreMods, customSpeed: scoreCustomSpeed } =
    OsuModUtils.droidStatsFromDroidString(score.mods);

  replayData.convertedMods.length = 0;
  replayData.convertedMods.push(...scoreMods);

  if (replayData.playerName !== score.player.name) {
    console.log("Username does not match.");
    await invalidateReplay();
    return;
  }

  if (replayData.replayVersion < LATEST_REPLAY_VERSION) {
    console.log("Invalid replay version.");
    await invalidateReplay();
    return;
  }

  const dataAccuracy = AccuracyUtils.smallPercentTo100(
    replayData.accuracy.value(mapInfo.objects)
  );

  const logDifferenceLarge = (
    whatIsDifferent: string,
    difference: number,
    expected?: number
  ) => {
    console.log(`${whatIsDifferent} difference way too big. ${difference}`);
    if (expected) {
      console.log(`Expected difference to be lower than: ${expected}`);
    }
  };

  const scoreAccuracy = OsuDroidScoreHelper.getAccuracyPercent(score);

  if (!Precision.almostEqualsNumber(scoreAccuracy, dataAccuracy)) {
    logDifferenceLarge("Accuracy", Math.abs(scoreAccuracy - dataAccuracy));
    await invalidateReplay();
    return;
  }

  if (!OsuModUtils.checkEquality(replayData.convertedMods, scoreMods)) {
    console.log("Mod combination does not match.");
    console.log(
      `Replay mods: ${OsuModUtils.toModAcronymString(replayData.convertedMods)}`
    );
    console.log(`Score mods: ${OsuModUtils.toModAcronymString(scoreMods)}`);
    await invalidateReplay();
    return;
  }

  const MAXIMUM_ACCEPTABLE_DIFFERENCE = 3;

  const validateDifference = async (
    a: number,
    b: number,
    name: string,
    acceptableDifference = MAXIMUM_ACCEPTABLE_DIFFERENCE
  ) => {
    const diff = Math.abs(a - b);
    if (diff > acceptableDifference) {
      logDifferenceLarge(name, diff, acceptableDifference);
      await invalidateReplay();
      return false;
    }
    return true;
  };

  const MAXIMUM_HITS_DIFFERENCE = MAXIMUM_ACCEPTABLE_DIFFERENCE;

  const validateHitDifference = async (a: number, b: number, name: string) =>
    await validateDifference(a, b, name, MAXIMUM_HITS_DIFFERENCE);

  const validatedKatu = await validateHitDifference(
    replayData.hit100k,
    score.hKatu,
    "katu"
  );

  if (!validatedKatu) return;

  const validatedGeki = await validateHitDifference(
    replayData.hit300k,
    score.hGeki,
    "geki"
  );

  if (!validatedGeki) return;

  const validatedCombo = await validateDifference(
    replayData.maxCombo,
    score.maxCombo,
    "Max combo"
  );

  if (!validatedCombo) return;

  if (
    scoreCustomSpeed &&
    !Precision.almostEqualsNumber(
      scoreCustomSpeed,
      replayData.speedModification
    )
  ) {
    logDifferenceLarge(
      "Custom speed.",
      Math.abs(scoreCustomSpeed - replayData.speedModification)
    );
    await invalidateReplay();
    return;
  }

  /**
   * Validates the difference between current replay data score, and user submitted score.
   */
  const validateScoreDifference = async (
    name: string,
    expectedDifferenceMultiplier: number,
    replayDataScore = replayData.score
  ) => {
    const dash = "-".repeat(5);

    console.log(`${dash}${name}${dash}`);
    console.log(`User score: ${score.score}`);
    console.log(`Replay score: ${replayDataScore}`);

    return await validateDifference(
      replayDataScore,
      score.score,
      name,
      mean([replayDataScore, score.score]) * expectedDifferenceMultiplier
    );
  };

  /**
   * Since we already checked for the combo, the difference of the score must not be too large for validation.
   */
  const validatedScore = await validateScoreDifference("score", 0.1);

  if (!validatedScore) return;

  const customScoreMultiplierMods = replayData.convertedMods.filter((m) =>
    OsuModUtils.MODS_WITH_CUSTOM_MULTIPLIER.includes(m.constructor.prototype)
  );

  if (customScoreMultiplierMods.length > 0) {
    console.log(
      `Score has the following custom server score mods: ${OsuModUtils.toModAcronymString(
        customScoreMultiplierMods
      )}`
    );
  } else {
    /**
     * Expected difference is large due to the reason on how osu!droid scoring system works
     * related to the formula that i used for server calculation.
     */
    const validatedScoreEstimation = await validateScoreDifference(
      "estimated score",
      2,
      estimatedScore
    );

    if (!validatedScoreEstimation) return;
  }

  score.score = Math.round(estimatedScore);

  const stats = new MapStats({
    ar: replayData.forcedAR,
    speedMultiplier: replayData.speedModification,
    isForceAR: Boolean(replayData.forcedAR),
  });

  replay.map = new DroidStarRating().calculate({
    map: mapInfo.map,
    mods: replayData.convertedMods,
    stats,
  });

  replay.checkFor3Finger();

  /**
   * We only recalculate the score if it is affected by any
   * replay analyzer changes.
   */
  if (replay.tapPenalty >= 0) {
    const performance = new DroidPerformanceCalculator().calculate({
      stars: replay.map,
      tapPenalty: replay.tapPenalty,
      combo: score.maxCombo,
      accPercent: new Accuracy({
        n300: score.h300,
        n100: score.h100,
        n50: score.h50,
        nmiss: score.h0,
      }),
    });
    score.pp = performance.total;
  }

  await prisma.osuDroidScore.update({
    where: {
      id: score.id,
    },
    data: {
      replay: rawReplay,
      pp: score.pp,
    },
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
