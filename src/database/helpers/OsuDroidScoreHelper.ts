import {
  OsuBeatmap,
  OsuDroidScore,
  OsuDroidUser,
  Prisma,
  SubmissionStatus,
} from "@prisma/client";
import {
  Accuracy,
  MapInfo,
  MapStats,
  Mod,
  ModHidden,
  rankedStatus,
} from "@rian8337/osu-base";
import {
  DroidStarRating,
  DroidPerformanceCalculator,
} from "@rian8337/osu-difficulty-calculator";
import assert from "assert";
import { differenceInSeconds } from "date-fns";
import { IHasError } from "../../interfaces/IHasError";
import { OsuModUtils } from "../../osu/OsuModUtils";
import { AccuracyUtils } from "../../osu/droid/AccuracyUtils";
import { SubmissionStatusUtils } from "../../osu/droid/enum/SubmissionStatus";
import {
  ActiveGlobalLeaderboardMetric,
  ActiveScoreLeaderboardMetric,
  GameRules,
  OsuDroidScoreMetric,
} from "../GameRules";
import { ScoreGrade } from "../../osu/ScoreGrade";
import { BeatmapManager } from "../managers/BeatmapManager";
import { GameMetrics } from "../GameMetrics";
import { OsuDroidUserHelper } from "./OsuDroidUserHelper";
import { prisma } from "../../../lib/prisma";
import { isNumber, percentFrom } from "../../utils/number";
import { AtLeast, Tuple, MustHave } from "../../utils/types";

const getActiveScoreMetricKeyFor = (
  metric: OsuDroidScoreMetric | GameMetrics
): ScoreKeyForMetric<typeof metric> => {
  return metric === "pp" ? "pp" : "score";
};

export const SCORE_GLOBAL_LEADERBOARD_METRIC_KEY = getActiveScoreMetricKeyFor(
  GameRules.global_leaderboard_metric
) as ScoreKeyForMetric<ActiveGlobalLeaderboardMetric>;

export const SCORE_LEADERBOARD_SCORE_METRIC_KEY = getActiveScoreMetricKeyFor(
  GameRules.score_leaderboard_metric
) as ScoreKeyForMetric<ActiveScoreLeaderboardMetric>;

export type ScoreKeyForMetric<
  T extends "pp" | "score" | "totalScore" | "rankedScore"
> = keyof Pick<OsuDroidScore, T extends "pp" ? "pp" : "score">;

export type ExtraModData = {
  customSpeed: number;
};

type RequiredSubmissionPlayerKeys = keyof Pick<
  OsuDroidUser,
  "name" | "playing" | "id"
>;

type SubmissionPlayer = AtLeast<OsuDroidUser, RequiredSubmissionPlayerKeys>;

export type CalculatableScoreKeys = keyof Pick<OsuDroidScore, "status">;

export type OsuDroidScoreWithPlayer = OsuDroidScore & {
  player: SubmissionPlayer;
};

export type CalculatableScore = AtLeast<
  OsuDroidScore,
  CalculatableScoreKeys | typeof SCORE_GLOBAL_LEADERBOARD_METRIC_KEY
>;

export type ScoreWithBeatmap = {
  beatmap: OsuBeatmap;
};

export type SuccessSubmissionScoreReturnType = {
  score: OsuDroidScoreWithoutGenerated;
  map: MapInfo;
};

export type OsuDroidScoreWithExtra = Omit<OsuDroidScore, "extra"> & {
  extra: Prisma.JsonValue;
};

export type ErrorSubmissionScoreReturnType = IHasError<string>;

type SubmissionScoreReturnType = Promise<
  SuccessSubmissionScoreReturnType | ErrorSubmissionScoreReturnType
>;

export function isSubmissionScoreReturnError(
  data: unknown
): data is ErrorSubmissionScoreReturnType {
  const tData = data as ErrorSubmissionScoreReturnType;
  return typeof tData.error === "string";
}

export type OsuDroidScoreWithoutGenerated = Omit<
  OsuDroidScore,
  "id" | "date" | "replayOnceVerified" | "beatmapDatabaseId"
>;

export type OsuDroidScoreHitDataKeys = keyof Pick<
  OsuDroidScore,
  "h300" | "h100" | "h50" | "h0"
>;

export type OsuDroidScoreAccuracyCalculatable = AtLeast<
  OsuDroidScore,
  OsuDroidScoreHitDataKeys
>;

export class OsuDroidScoreHelper {
  static ABLE_TO_SUBMIT_STATUS = [
    rankedStatus.RANKED,
    rankedStatus.LOVED,
    rankedStatus.APPROVED,
  ];

  static getMods(score: OsuDroidScore) {
    return OsuModUtils.droidStringToMods(score.mods);
  }

  static getGlobalLeaderboardMetric(
    score: AtLeast<
      OsuDroidScore,
      ScoreKeyForMetric<ActiveGlobalLeaderboardMetric>
    >
  ) {
    return score[SCORE_GLOBAL_LEADERBOARD_METRIC_KEY];
  }

  static getScoreLeaderboardMetric(
    score: AtLeast<
      OsuDroidScore,
      ScoreKeyForMetric<ActiveScoreLeaderboardMetric>
    >
  ) {
    return score[SCORE_LEADERBOARD_SCORE_METRIC_KEY];
  }

  static isBeatmapSubmittable(map: MapInfo) {
    return this.ABLE_TO_SUBMIT_STATUS.includes(map.approved);
  }

  static getAccuracyDroid(score: OsuDroidScoreAccuracyCalculatable) {
    return AccuracyUtils.acc100toDroid(this.getAccuracyPercent(score));
  }

  static getAccuracyPercent(score: OsuDroidScoreAccuracyCalculatable) {
    const accuracy = new Accuracy({
      n300: score.h300,
      n100: score.h100,
      n50: score.h50,
      nmiss: score.h0,
    });
    return AccuracyUtils.smallPercentTo100(accuracy.value());
  }

  static async fromSubmission(
    data: string,
    user: SubmissionPlayer,
    playerId = user?.id
  ): Promise<SubmissionScoreReturnType> {
    const dataArray: string[] = data.split(" ");

    const DATA_ARRAY_LENGHT = 14;

    if (dataArray.length != DATA_ARRAY_LENGHT) {
      return {
        error: "Invalid score data lenght.",
      };
    }

    const dataTuple = dataArray as unknown as Tuple<
      string,
      typeof DATA_ARRAY_LENGHT
    >;

    const modsDroidString = dataTuple[0];

    const modStats = OsuModUtils.droidStatsFromDroidString(modsDroidString);

    const { mods, customSpeed } = modStats;

    const toBuildScore: Partial<OsuDroidScoreWithPlayer> = {};

    if (!OsuModUtils.isCompatible(mods)) {
      return {
        error: "Incompatible mods.",
      };
    }

    if (!OsuModUtils.isModRanked(mods)) {
      return {
        error: "Unranked mods",
      };
    }

    toBuildScore.mode = GameRules.game_mode;

    toBuildScore.mods = modsDroidString;

    console.log(`Mods: ${toBuildScore.mods}`);
    console.log(`Droid mods: ${modsDroidString}`);

    const extraModData: ExtraModData = {
      customSpeed,
    };

    /**
     * Custom speed defaults to 1.
     * if a custom speed is valid it should be a number and also a
     * multiple of 0.05 otherwise it is kinda suspicious.
     */
    if (
      !(
        isNumber(extraModData.customSpeed) &&
        Math.round(customSpeed * 100) % 5 === 0 &&
        extraModData.customSpeed >= 0.5 &&
        extraModData.customSpeed <= 2
      )
    ) {
      return {
        error: `Invalid custom speed: ${extraModData.customSpeed}`,
      };
    }

    if (extraModData.customSpeed !== 1) {
      extraModData.customSpeed = customSpeed;
      console.log(`Custom speed: ${extraModData.customSpeed}`);
    }

    const dataDate = new Date(dataTuple[11]);

    /**
     * space between score submission and requesting submission to the server way too long.
     */
    if (differenceInSeconds(dataDate, new Date()) > 10) {
      return {
        error: "Took to long to get score from submission.",
      };
    }

    const username = dataTuple[13];

    assert(playerId);

    if (user.name !== username) {
      return {
        error: `Score submission username didn't match. (${user.name} != ${username})`,
      };
    }

    toBuildScore.player = user;
    toBuildScore.playerId = user.id;

    if (!user.playing) {
      return {
        error: "User isn't playing a beatmap.",
      };
    }

    const mapInfo = await BeatmapManager.fetchBeatmap(user.playing);

    if (!mapInfo || !mapInfo.map) {
      return {
        error: "Score's beatmap not found.",
      };
    }

    if (!this.isBeatmapSubmittable(mapInfo)) {
      return {
        error: "Beatmap not approved",
      };
    }

    console.log("Logging replay data.");

    dataTuple.forEach((d) => {
      console.log(d);
    });

    console.log("Finished log.");

    const sliceDataToInteger = (from: number, to: number) => {
      const integerData = dataTuple.slice(from, to).map((v) => parseInt(v));
      if (!integerData.every((v) => isNumber(v))) {
        console.log("Invalid data, passed for score.");
        return;
      }
      return integerData;
    };

    const firstIntegerData = sliceDataToInteger(1, 3);

    if (!firstIntegerData) {
      return {
        error: "Invalid replay firstIntegerData.",
      };
    }

    type TypeIntegerData<N extends number> = Tuple<number, N>;

    const typedFirstIntegerData =
      firstIntegerData as unknown as TypeIntegerData<2>;

    toBuildScore.score = typedFirstIntegerData[0];
    toBuildScore.maxCombo = typedFirstIntegerData[1];

    const secondIntegerData = sliceDataToInteger(4, 10);

    if (!secondIntegerData) {
      return {
        error: "Invalid replay second integer data",
      };
    }

    const typedSecondIntegerData =
      secondIntegerData as unknown as TypeIntegerData<6>;

    toBuildScore.hGeki = typedSecondIntegerData[0];
    toBuildScore.h300 = typedSecondIntegerData[1];
    toBuildScore.hKatu = typedSecondIntegerData[2];
    toBuildScore.h100 = typedSecondIntegerData[3];
    toBuildScore.h50 = typedSecondIntegerData[4];
    toBuildScore.h0 = typedSecondIntegerData[5];

    console.log("Calculating score...");

    const accValue = new Accuracy({
      n300: toBuildScore.h300,
      n100: toBuildScore.h100,
      n50: toBuildScore.h50,
      nmiss: toBuildScore.h0,
    });

    const stars = new DroidStarRating().calculate({
      map: mapInfo.map,
      mods,
      stats: new MapStats({
        mods,
        speedMultiplier: extraModData.customSpeed,
      }),
    });

    const performance = new DroidPerformanceCalculator().calculate({
      stars,
      accPercent: accValue,
      combo: toBuildScore.maxCombo,
    });

    toBuildScore.pp = Math.max(performance.total, 0);

    if (!isNumber(toBuildScore.pp)) {
      /**
       * Prevents NaN values server side until a fix is found.
       */
      toBuildScore.pp = 0;
    }

    const previousScore = await OsuDroidUserHelper.getBestScoreOnBeatmap(
      playerId,
      mapInfo.hash,
      GameRules.game_mode,
      {
        id: true,
        status: true,
        [SCORE_GLOBAL_LEADERBOARD_METRIC_KEY]: true,
      }
    );

    const builtScore: OsuDroidScoreWithoutGenerated = {
      mode: toBuildScore.mode,
      pp: toBuildScore.pp,
      score: toBuildScore.score,
      h300: toBuildScore.h300,
      h100: toBuildScore.h100,
      h50: toBuildScore.h50,
      h0: toBuildScore.h0,
      hGeki: toBuildScore.hGeki,
      hKatu: toBuildScore.hKatu,
      maxCombo: toBuildScore.maxCombo,
      mods: toBuildScore.mods,
      status: SubmissionStatus.FAILED,
      replay: null,
      playerId: playerId,
    };

    await this.calculateStatus(playerId, mapInfo, builtScore, previousScore);

    return {
      score: builtScore,
      map: mapInfo,
    };
  }

  static async getPlacement(
    score:
      | AtLeast<OsuDroidScore, typeof SCORE_LEADERBOARD_SCORE_METRIC_KEY>
      | AtLeast<
          OsuDroidScore,
          typeof SCORE_LEADERBOARD_SCORE_METRIC_KEY | "id"
        >,
    mapHash: string
  ) {
    let where = Prisma.sql`
      WHERE ${SCORE_LEADERBOARD_SCORE_METRIC_KEY} >= ${
      score[SCORE_LEADERBOARD_SCORE_METRIC_KEY]
    }
      AND b.hash = ${mapHash}
      AND status IN (${Prisma.join(SubmissionStatusUtils.USER_BEST_STATUS)})
      `;

    if (score.id) {
      where = Prisma.sql`${where} AND id != ${score.id}`;
    }

    const query = Prisma.sql`
      SELECT COUNT(DISTINCT playerId) as "count"
      FROM OsuDroidScore s
      JOIN OsuBeatmap b
      ON s.beatmapDatabaseId = b.databaseId
      ${where}
      ORDER BY ${SCORE_LEADERBOARD_SCORE_METRIC_KEY} desc
    `;

    const betterScores = await prisma.$queryRaw<[{ count: BigInt }]>`${query}`;

    // Count returns a bigint
    return Number(betterScores[0].count) + 1;
  }

  static toAccuracySelect<T extends Prisma.OsuDroidScoreSelect>(select: T) {
    return {
      ...select,
      ...{
        h300: true,
        h100: true,
        h50: true,
        h0: true,
      },
    };
  }

  static toGradeableSelect<T extends Prisma.OsuDroidScoreSelect>(select: T) {
    return this.toAccuracySelect({
      ...select,
      mods: true,
    });
  }

  static async calculateStatus(
    userId: number,
    map: MapInfo,
    newScore: CalculatableScore,
    previousBestScore?: CalculatableScore | null
  ) {
    const approveSubmission = () => this.changeStatusToApproved(newScore, map);

    if (!previousBestScore) {
      const approveWithNoPrevious = () => {
        console.log("Previous best not found...");
        approveSubmission();
      };

      // if the score was provided but not found
      if (previousBestScore === null) {
        approveWithNoPrevious();
      }

      const gotPreviousBestScore =
        await OsuDroidUserHelper.getBestScoreOnBeatmap(
          userId,
          map.hash,
          GameRules.game_mode,
          {
            id: true,
            status: true,
            beatmap: true,
            [SCORE_GLOBAL_LEADERBOARD_METRIC_KEY]: true,
          }
        );

      if (!gotPreviousBestScore) {
        approveWithNoPrevious();
        return;
      }

      previousBestScore = gotPreviousBestScore as CalculatableScore;
    }

    console.log("Previous best found...");

    assert(previousBestScore);

    if (
      this.getGlobalLeaderboardMetric(newScore) >=
      this.getGlobalLeaderboardMetric(previousBestScore)
    ) {
      console.log("The new score is better than the previous score.");

      approveSubmission();

      previousBestScore.status = SubmissionStatus.SUBMITTED;

      // .then for background
      prisma.osuDroidScore
        .update({
          where: {
            id: previousBestScore.id,
          },
          data: {
            status: previousBestScore.status,
            replay: null,
          },
        })
        .then();

      return;
    }

    newScore.status = SubmissionStatus.FAILED;
  }

  static changeStatusToApproved(
    score: AtLeast<OsuDroidScore, "status">,
    map: MapInfo
  ) {
    score.status =
      map.approved === rankedStatus.RANKED ||
      map.approved === rankedStatus.APPROVED
        ? SubmissionStatus.BEST
        : SubmissionStatus.APPROVED;
  }

  static getGrade(
    score: MustHave<OsuDroidScoreAccuracyCalculatable, "mods">,
    provide?: {
      accuracy?: number;
      mods?: Mod[];
    }
  ): ScoreGrade {
    if (!provide) {
      provide = {};
    }

    if (!provide.accuracy) {
      provide.accuracy = OsuDroidScoreHelper.getAccuracyPercent(score);
    }

    if (!provide.mods) {
      provide.mods = OsuModUtils.droidStatsFromDroidString(score.mods).mods;
    }

    const { accuracy, mods } = provide;

    const isHidden = OsuModUtils.hasMods(mods, [ModHidden]);

    if (accuracy === 100) {
      return isHidden ? ScoreGrade.XH : ScoreGrade.X;
    }

    const totalHitData = score.h300 + score.h100 + score.h50 + score.h0;

    const percents = {
      hit300: percentFrom(score.h300, totalHitData),
      hit50: percentFrom(score.h50, totalHitData),
    };

    const noMisses = score.h0 === 0;

    if (percents.hit300 >= 90 && percents.hit50 <= 1 && noMisses) {
      return isHidden ? ScoreGrade.SH : ScoreGrade.S;
    }

    if ((percents.hit300 >= 80 && noMisses) || percents.hit300 >= 90) {
      return ScoreGrade.A;
    }

    if ((percents.hit300 >= 70 && noMisses) || percents.hit300 >= 80) {
      return ScoreGrade.B;
    }

    if (percents.hit300 >= 60) {
      return ScoreGrade.C;
    }

    return ScoreGrade.D;
  }
}
