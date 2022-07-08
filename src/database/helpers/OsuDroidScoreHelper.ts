import {
  OsuDroidScore,
  OsuDroidUser,
  Prisma,
  ScoreGrade,
  SubmissionStatus,
} from "@prisma/client";
import { Accuracy, MapInfo, MapStats, rankedStatus } from "@rian8337/osu-base";
import {
  DroidStarRating,
  DroidPerformanceCalculator,
} from "@rian8337/osu-difficulty-calculator";
import assert from "assert";
import { differenceInSeconds } from "date-fns";
import { EnumUtils } from "../../utils/enum";
import { EnvironmentConstants } from "../../constants/EnvironmentConstants";
import { IHasError } from "../../interfaces/IHasError";
import { NipaaModUtil } from "../../osu/NipaaModUtils";
import { AccuracyUtils } from "../../osu_droid/AccuracyUtils";
import { SubmissionStatusUtils } from "../../osu_droid/enum/SubmissionStatus";
import { NumberUtils } from "../../utils/number";
import { AtLeast, Tuple } from "../../utils/types";
import {
  ActiveGlobalLeaderboardMetric,
  ActiveScoreLeaderboardMetric,
  DatabaseSetup,
  OsuDroidScoreMetric,
} from "../DatabaseSetup";
import { BeatmapManager } from "../managers/BeatmapManager";
import { Metrics } from "../Metrics";
import { OsuDroidUserHelper } from "./OsuDroidUserHelper";
import { prisma } from "../../../lib/prisma";

type ScoreMetricKey = keyof Pick<OsuDroidScore, "score" | "pp">;

const getActiveScoreMetricKeyFor = (
  metric: OsuDroidScoreMetric | Metrics
): ScoreKeyForMetric<typeof metric> => {
  return metric === "pp" ? "pp" : "score";
};

const GLOBAL_LEADERBOARD_SCORE_METRIC_KEY = getActiveScoreMetricKeyFor(
  DatabaseSetup.global_leaderboard_metric
) as ScoreKeyForMetric<ActiveGlobalLeaderboardMetric>;

const SCORE_LEADERBOARD_SCORE_METRIC_KEY = getActiveScoreMetricKeyFor(
  DatabaseSetup.score_leaderboard_metric
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

export type CalculatableScoreKeys = keyof Pick<
  OsuDroidScore,
  "mapHash" | "status"
>;

export type OsuDroidScoreWithPlayer = OsuDroidScore & {
  player: SubmissionPlayer;
};

export type CalculatableScore = AtLeast<
  OsuDroidScore,
  CalculatableScoreKeys | ScoreMetricKey
>;

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

export type OsuDroidScoreWithoutGenerated = Omit<OsuDroidScore, "id" | "date">;

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
    return NipaaModUtil.droidStringToMods(score.mods);
  }

  static getGlobalLeaderboardMetricKey() {
    return GLOBAL_LEADERBOARD_SCORE_METRIC_KEY;
  }

  static getScoreLeaderboardMetricKey() {
    return SCORE_LEADERBOARD_SCORE_METRIC_KEY;
  }

  static getGlobalLeaderboardMetric(
    score: AtLeast<
      OsuDroidScore,
      ScoreKeyForMetric<ActiveGlobalLeaderboardMetric>
    >
  ) {
    return score[GLOBAL_LEADERBOARD_SCORE_METRIC_KEY];
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
    const accuracy = new Accuracy({
      n300: score.h300,
      n100: score.h100,
      n50: score.h50,
      nmiss: score.h0,
    });

    return accuracy.value();
  }

  static getAccuracyPercent(score: OsuDroidScoreAccuracyCalculatable) {
    return AccuracyUtils.smallPercentTo100(this.getAccuracyDroid(score));
  }

  static async fromSubmission(
    data: string,
    user: SubmissionPlayer,
    playerId = user?.id
  ): SubmissionScoreReturnType {
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

    const modStats = NipaaModUtil.droidStatsFromDroidString(modsDroidString);

    const { mods, customSpeed } = modStats;

    const toBuildScore: Partial<OsuDroidScoreWithPlayer> = {};

    if (!NipaaModUtil.isCompatible(mods)) {
      return {
        error: "Incompatible mods.",
      };
    }

    if (!NipaaModUtil.isModRanked(mods)) {
      return {
        error: "Unranked mods",
      };
    }

    toBuildScore.mode = DatabaseSetup.game_mode;

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
        NumberUtils.isNumber(extraModData.customSpeed) &&
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
    if (
      differenceInSeconds(dataDate, new Date()) >
      EnvironmentConstants.EDGE_FUNCTION_LIMIT_RESPONSE_TIME
    ) {
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

    toBuildScore.mapHash = user.playing;

    const mapInfo = await BeatmapManager.fetchBeatmap(toBuildScore.mapHash);

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
      if (!integerData.every((v) => NumberUtils.isNumber(v))) {
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

    // TODO WE SHOULD PROBABLY INFER THE GRADE FROM THE DATA THAT WE ALREADY HAVE
    // TRUSTING THE CLIENT FOR THAT FEELS KINDA DUMB IDK?
    const grade = EnumUtils.getValueByKeyUntyped(ScoreGrade, dataTuple[3]);

    if (!grade) {
      return {
        error: "Invalid grade for scoring passed to server",
      };
    }

    toBuildScore.grade = grade;

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

    toBuildScore.fc = toBuildScore.maxCombo === mapInfo.map.maxCombo;

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

    if (!NumberUtils.isNumber(toBuildScore.pp)) {
      /**
       * Prevents NaN values server side until a fix is found.
       */
      toBuildScore.pp = 0;
    }

    const previousScore = await OsuDroidUserHelper.getBestScoreOnBeatmap(
      playerId,
      toBuildScore.mapHash,
      DatabaseSetup.game_mode,
      {
        select: {
          id: true,
          status: true,
          [GLOBAL_LEADERBOARD_SCORE_METRIC_KEY]: true,
        },
      }
    );

    const builtScore: OsuDroidScoreWithoutGenerated = {
      mode: toBuildScore.mode,
      mapHash: toBuildScore.mapHash,
      pp: toBuildScore.pp,
      score: toBuildScore.score,
      h300: toBuildScore.h300,
      h100: toBuildScore.h100,
      h50: toBuildScore.h50,
      h0: toBuildScore.h0,
      hGeki: toBuildScore.hGeki,
      hKatu: toBuildScore.hKatu,
      maxCombo: toBuildScore.maxCombo,
      grade: toBuildScore.grade,
      mods: toBuildScore.mods,
      fc: toBuildScore.fc,
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
      | AtLeast<OsuDroidScore, "mapHash">
      | AtLeast<OsuDroidScore, "mapHash" | "id">
  ) {
    const query: Prisma.OsuDroidScoreCountArgs = {
      where: {
        mapHash: score.mapHash,
        [GLOBAL_LEADERBOARD_SCORE_METRIC_KEY]: {
          gte: score[GLOBAL_LEADERBOARD_SCORE_METRIC_KEY],
        },
        status: {
          in: SubmissionStatusUtils.USER_BEST_STATUS,
        },
      },
    };

    if (score.id) {
      assert(query.where);
      query.where.id = {
        not: score.id,
      };
    }

    const nextRank = await prisma.osuDroidScore.count(query);

    return nextRank + 1;
  }

  static async calculateStatus(
    userId: number,
    map: MapInfo,
    newScore: CalculatableScore,
    previousBestScore?: CalculatableScore | null
  ) {
    const approveSubmission = () => this.changeStatusToApproved(newScore, map);

    if (!previousBestScore) {
      const gotPreviousBestScore =
        await OsuDroidUserHelper.getBestScoreOnBeatmap(
          userId,
          newScore.mapHash,
          DatabaseSetup.game_mode,
          {
            select: {
              id: true,
              status: true,
              [GLOBAL_LEADERBOARD_SCORE_METRIC_KEY]: true,
            },
          }
        );

      if (!gotPreviousBestScore) {
        console.log("Previous best not found...");
        approveSubmission();
        return;
      }

      previousBestScore = gotPreviousBestScore;
    }

    console.log("Previous best found...");

    assert(previousBestScore);

    if (
      OsuDroidScoreHelper.getGlobalLeaderboardMetric(newScore) >
      OsuDroidScoreHelper.getGlobalLeaderboardMetric(previousBestScore)
    ) {
      console.log("The new score is better than the previous score.");

      approveSubmission();

      previousBestScore.status = SubmissionStatus.SUBMITTED;

      await prisma.osuDroidScore.update({
        where: {
          id: previousBestScore.id,
        },
        data: {
          status: previousBestScore.status,
        },
      });

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
}
