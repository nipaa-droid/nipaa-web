import {
  OsuDroidScore,
  OsuDroidStats,
  Prisma,
  SubmissionStatus,
} from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { SubmissionStatusUtils } from "../../osu_droid/enum/SubmissionStatus";
import { AtLeast, MustHave } from "../../utils/types";
import { DatabaseSetup } from "../DatabaseSetup";
import { Metrics } from "../Metrics";
import {
  OsuDroidScoreAccuracyCalculatable,
  OsuDroidScoreHelper,
  OsuDroidScoreHitDataKeys,
} from "./OsuDroidScoreHelper";

export type OsuDroidStatsToCalculateScores = AtLeast<
  OsuDroidStats,
  "userId" | "mode"
>;

export enum OsuDroidStatsBatchCalculate {
  ACCURACY,
  METRIC,
}

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

  static getMetricToCalculateQuery(
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

  static getAccuracyFromScores(scores: OsuDroidScoreAccuracyCalculatable[]) {
    const weightedData = this.#weightData<
      OsuDroidScoreHitDataKeys,
      { accuracySum: number; weighting: number }
    >(
      {
        accuracySum: -1,
        weighting: -1,
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

  static async getAccuracy(stats: OsuDroidStatsToCalculateScores) {
    const query = this.getMetricToCalculateQuery(stats);

    query.select = {
      h300: true,
      h100: true,
      h50: true,
      h0: true,
    };

    const scores = await prisma.osuDroidScore.findMany(query);

    return this.getAccuracyFromScores(scores);
  }

  static getPerformanceFromScores(scores: AtLeast<OsuDroidScore, "pp">[]) {
    return this.#weightData<"pp", number>(
      0,
      scores,
      (score, weighting, acc) => acc + score.pp * weighting
    );
  }

  static async getPerformance(stats: OsuDroidStatsToCalculateScores) {
    const query = this.getMetricToCalculateQuery(stats);

    query.select = {
      pp: true,
    };

    const scores = await prisma.osuDroidScore.findMany(query);

    return this.getPerformanceFromScores(scores);
  }

  static async #getTotalScoreBase(where: Prisma.OsuDroidScoreWhereInput) {
    const aggregate = await prisma.osuDroidScore.aggregate({
      where,
      _sum: {
        score: true,
      },
    });
    return aggregate._sum.score ?? 0;
  }

  static async getTotalRankedScore(stats: OsuDroidStatsToCalculateScores) {
    return await this.#getTotalScoreBase(
      this.#getRankedScoresForStatsQuery(stats)
    );
  }

  static async getTotalScore(stats: OsuDroidStatsToCalculateScores) {
    return await this.#getTotalScoreBase(this.#getScoresForStatsQuery(stats));
  }

  static async getGlobalRank(playerId: number, metric: number) {
    const userWhere: Prisma.OsuDroidUserWhereInput = {
      id: {
        not: playerId,
      },
    };

    switch (DatabaseSetup.global_leaderboard_metric as Metrics) {
      case Metrics.pp:
        const betterUsersByPP = await prisma.osuDroidUser.findMany({
          where: userWhere,
          select: {
            scores: {
              select: {
                pp: true,
              },
              orderBy: {
                pp: Prisma.SortOrder.desc,
              },
              take: 50,
            },
          },
        });

        const usersScores = betterUsersByPP.map((user) => user.scores);

        return usersScores
          .map((scores) => this.getPerformanceFromScores(scores))
          .reduce((acc, cur) => {
            return cur >= metric ? ++acc : acc;
          });
      case Metrics.rankedScore:
      case Metrics.totalScore:
        const rankByTotalScoreQuery: MustHave<
          Prisma.OsuDroidScoreGroupByArgs,
          "orderBy"
        > = {
          by: ["playerId"],
          where: {
            playerId: {
              not: playerId,
            },
          },
          orderBy: {
            _sum: {
              score: Prisma.SortOrder.desc,
            },
          },
          _sum: {
            score: true,
          },
          having: {
            score: {
              _sum: {
                gte: metric,
              },
            },
          },
        };

        switch (DatabaseSetup.global_leaderboard_metric as Metrics) {
          case Metrics.rankedScore:
            rankByTotalScoreQuery.where = {
              status: {
                in: SubmissionStatusUtils.USER_BEST_STATUS,
              },
            };
        }

        const better = await prisma.osuDroidScore.groupBy(
          rankByTotalScoreQuery
        );

        return better.length + 1;
    }
  }

  static async getMetric(stats: OsuDroidStatsToCalculateScores) {
    switch (DatabaseSetup.global_leaderboard_metric as Metrics) {
      case Metrics.pp:
        return await this.getPerformance(stats);
      case Metrics.rankedScore:
        return await this.getTotalRankedScore(stats);
      case Metrics.totalScore:
        return await this.getTotalScore(stats);
    }
  }

  static async batchCalculate(
    stats: OsuDroidStatsToCalculateScores,
    calculate: OsuDroidStatsBatchCalculate[]
  ) {
    const query = this.getMetricToCalculateQuery(stats);

    if (
      calculate.find((batch) => batch === OsuDroidStatsBatchCalculate.METRIC)
    ) {
      switch (DatabaseSetup.global_leaderboard_metric as Metrics) {
        case Metrics.pp:
          query.select = {
            ...query.select,
            pp: true,
          };
      }
    }

    const scores = await prisma.osuDroidScore.findMany(query);

    const response = {
      accuracy: 0,
      metric: 0,
    };

    for (const batch of calculate) {
      switch (batch) {
        case OsuDroidStatsBatchCalculate.ACCURACY:
          response.accuracy = this.getAccuracyFromScores(scores);
          break;
        case OsuDroidStatsBatchCalculate.METRIC:
          switch (DatabaseSetup.global_leaderboard_metric as Metrics) {
            case Metrics.pp:
              response.metric = this.getPerformanceFromScores(scores);
              break;
            case Metrics.rankedScore:
              response.metric = await this.getTotalRankedScore(stats);
              break;
            case Metrics.totalScore:
              response.metric = await this.getTotalScore(stats);
              break;
          }
      }
    }

    return response;
  }
}
