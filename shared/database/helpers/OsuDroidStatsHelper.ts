import { OsuDroidStats, Prisma, SubmissionStatus } from "@prisma/client";
import assert from "assert";
import { DatabaseSetup } from "../DatabaseSetup";
import { Metrics } from "../Metrics";
import { OsuDroidScoreHelper } from "./OsuDroidScoreHelper";

export class OsuDroidStatsHelper {
  static #getScoresForStatsQuery(
    stats: OsuDroidStats
  ): Prisma.OsuDroidScoreWhereInput {
    return {
      playerId: stats.userId,
      mode: stats.mode,
    };
  }

  static #getRankedScoresForStatsQuery(
    stats: OsuDroidStats
  ): Prisma.OsuDroidScoreWhereInput {
    const query = this.#getScoresForStatsQuery(stats);
    query.status = SubmissionStatus.BEST;
    return query;
  }

  static #getMetricToCalculateQuery(
    stats: OsuDroidStats
  ): Prisma.OsuDroidScoreFindManyArgs {
    return {
      where: this.#getRankedScoresForStatsQuery(stats),
      take: 100,
    };
  }

  static #getWeightingFactor(i: number) {
    return Math.pow(0.95, i);
  }

  static async getAccuracy(stats: OsuDroidStats) {
    const query = this.#getMetricToCalculateQuery(stats);

    query.select = {
      h300: true,
      h100: true,
      h50: true,
      h0: true,
    };

    const scores = await prisma.osuDroidScore.findMany(query);

    let accSum = 0;
    let weight = 0;

    scores.forEach((score, i) => {
      const weighting = this.#getWeightingFactor(i);
      const accuracy = OsuDroidScoreHelper.getAccuracyPercent(score);

      accSum += accuracy * weighting;
      weight += weighting;
    });

    return accSum / weight;
  }

  static async getPerformance(stats: OsuDroidStats) {
    const query = this.#getMetricToCalculateQuery(stats);

    query.select = {
      pp: true,
    };

    const scores = await prisma.osuDroidScore.findMany(query);

    return scores.reduce(
      (acc, cur, i) => acc + cur.pp * this.#getWeightingFactor(i),
      0
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

  static async getTotalRankedScore(stats: OsuDroidStats) {
    return await this.#getTotalScoreBase(
      this.#getRankedScoresForStatsQuery(stats)
    );
  }

  static async getTotalScore(stats: OsuDroidStats) {
    return await this.#getTotalScoreBase(this.#getScoresForStatsQuery(stats));
  }

  static async getGlobalRank(stats: OsuDroidStats) {
    return (
      (await prisma.osuDroidStats.count({
        where: {
          userId: { not: stats.id },
          mode: stats.mode,
          [DatabaseSetup.metric]: stats.mode,
        },
      })) + 1
    );
  }

  static async getMetric(stats: OsuDroidStats) {
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
