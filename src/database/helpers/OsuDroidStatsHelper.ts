import {
  OsuDroidScore,
  OsuDroidStats,
  Prisma,
  SubmissionStatus,
} from "@prisma/client";
import assert from "assert";
import { prisma } from "../../../lib/prisma";
import { AtLeast, MustHave } from "../../utils/types";
import { DatabaseSetup } from "../DatabaseSetup";
import { Metrics } from "../Metrics";
import {
  OsuDroidScoreHelper,
  OsuDroidScoreHitDataKeys,
} from "./OsuDroidScoreHelper";

export type OsuDroidStatsToCalculateScores = AtLeast<
  OsuDroidStats,
  "userId" | "mode"
>;

export class OsuDroidStatsHelper {
  static #getScoresForStatsQuery(
    stats: OsuDroidStatsToCalculateScores
  ): Prisma.OsuDroidScoreWhereInput {
    return {
      playerId: stats.userId,
      mode: stats.mode,
    };
  }

  static #getRankedScoresForStatsQuery(
    stats: OsuDroidStatsToCalculateScores
  ): Prisma.OsuDroidScoreWhereInput {
    const query = this.#getScoresForStatsQuery(stats);
    query.status = SubmissionStatus.BEST;
    return query;
  }

  static #getMetricToCalculateQuery(
    stats: OsuDroidStatsToCalculateScores
  ): Prisma.OsuDroidScoreFindManyArgs {
    return {
      where: this.#getRankedScoresForStatsQuery(stats),
      take: 100,
    };
  }

  static #weightData<K extends keyof OsuDroidScore, T = undefined>(
    base: T,
    scores: AtLeast<OsuDroidScore, K>[],
    calculate: (
      score: AtLeast<OsuDroidScore, K>,
      weighting: number,
      accumulator: T
    ) => T
  ) {
    let currentAccumulator = base;
    scores.forEach((score, i) => {
      const weighting = Math.pow(0.95, i);

      currentAccumulator = calculate(score, weighting, base);
    });
    return currentAccumulator;
  }

  static async getAccuracy(stats: OsuDroidStatsToCalculateScores) {
    const query = this.#getMetricToCalculateQuery(stats);

    query.select = {
      h300: true,
      h100: true,
      h50: true,
      h0: true,
    };

    const scores = await prisma.osuDroidScore.findMany(query);

    const weightedData = this.#weightData<
      OsuDroidScoreHitDataKeys,
      { accuracySum: number; weighting: number }
    >(
      {
        accuracySum: 0,
        weighting: 0,
      },
      scores,
      (score, weighting, acc) => {
        const accuracy = OsuDroidScoreHelper.getAccuracyDroid(score);
        return {
          accuracySum: acc.accuracySum + accuracy * weighting,
          weighting: acc.weighting + weighting,
        };
      }
    );

    return weightedData.accuracySum / weightedData.weighting;
  }

  static async getPerformance(stats: OsuDroidStatsToCalculateScores) {
    const query = this.#getMetricToCalculateQuery(stats);

    query.select = {
      pp: true,
    };

    const scores = await prisma.osuDroidScore.findMany(query);

    return this.#weightData<"pp", number>(
      0,
      scores,
      (score, weighting, acc) => acc + score.pp * weighting
    );
  }

  static async #getTotalScoreBase(where: Prisma.OsuDroidScoreWhereInput) {
    const aggregate = await prisma.osuDroidScore.aggregate({
      where,
      _sum: {
        score: true,
      },
    });

    assert(aggregate._sum.score);

    return aggregate._sum.score;
  }

  static async getTotalRankedScore(stats: OsuDroidStatsToCalculateScores) {
    return await this.#getTotalScoreBase(
      this.#getRankedScoresForStatsQuery(stats)
    );
  }

  static async getTotalScore(stats: OsuDroidStatsToCalculateScores) {
    return await this.#getTotalScoreBase(this.#getScoresForStatsQuery(stats));
  }

  static async getGlobalRank(
    stats: MustHave<OsuDroidStatsToCalculateScores, "id">
  ) {
    return (
      (await prisma.osuDroidStats.count({
        where: {
          userId: { not: stats.id },
          mode: stats.mode,
        },
        orderBy: {
          [DatabaseSetup.metric]: true,
        },
      })) + 1
    );
  }

  static async getMetric(stats: OsuDroidStatsToCalculateScores) {
    switch (DatabaseSetup.metric) {
      case Metrics.pp:
        return await this.getPerformance(stats);
      case Metrics.rankedScore:
        return await this.getTotalRankedScore(stats);
      case Metrics.totalScore:
        return await this.getTotalScore(stats);
      default:
        throw "Metric for stats not found";
    }
  }

  static async getRoundedMetric(stats: OsuDroidStats) {
    const metric = await this.getMetric(stats);
    return Math.round(metric);
  }
}
