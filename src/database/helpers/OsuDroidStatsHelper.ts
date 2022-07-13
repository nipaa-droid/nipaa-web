import { OsuDroidScore, OsuDroidStats, Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { AccuracyUtils } from "../../osu/droid/AccuracyUtils";
import { SubmissionStatusUtils } from "../../osu/droid/enum/SubmissionStatus";
import { AtLeast, MustHave, NullableKeys } from "../../utils/types";
import { DatabaseSetup } from "../DatabaseSetup";
import { GameMetrics } from "../GameMetrics";
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
  static getScoresForStatsQuery(
    stats: OsuDroidStatsToCalculateScores
  ): Prisma.OsuDroidScoreWhereInput {
    return {
      playerId: stats.userId,
      mode: stats.mode,
    };
  }

  static getRankedScoresForStatsQuery(
    stats: OsuDroidStatsToCalculateScores
  ): Prisma.OsuDroidScoreWhereInput {
    const query = this.getScoresForStatsQuery(stats);
    query.status = {
      in: SubmissionStatusUtils.USER_BEST_STATUS,
    };
    return query;
  }

  static toMetricToCalculateQuery(
    query: Prisma.OsuDroidScoreFindManyArgs
  ): Prisma.OsuDroidScoreFindManyArgs {
    query.where = query.where ?? {};

    query.where.status = {
      ...(typeof query.where.status === "object" ? query.where.status : {}),
      in: SubmissionStatusUtils.USER_BEST_STATUS,
    };

    query.take = 100;

    query.orderBy = {
      ...query.orderBy,
      pp: Prisma.SortOrder.desc,
    };

    return query;
  }

  static toMetricToCalculateQueryForStats(
    stats: OsuDroidStatsToCalculateScores
  ): Prisma.OsuDroidScoreFindManyArgs {
    return this.toMetricToCalculateQuery({
      where: this.getScoresForStatsQuery(stats),
    });
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
      currentAccumulator = calculate(score, weighting, currentAccumulator);
    });
    return currentAccumulator;
  }

  static getAccuracyFromScores(scores: OsuDroidScoreAccuracyCalculatable[]) {
    if (scores.length === 0) {
      return AccuracyUtils.acc100toDroid(100);
    }

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

  static async getAccuracy(stats: OsuDroidStatsToCalculateScores) {
    const query = OsuDroidScoreHelper.toAccuracyQuery(
      this.toMetricToCalculateQueryForStats(stats)
    );

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

  static #toPerformanceQuery(query: Prisma.OsuDroidScoreFindManyArgs) {
    query.select = {
      ...query.select,
      pp: true,
    };
    return query;
  }

  static async getPerformance(stats: OsuDroidStatsToCalculateScores) {
    const query = this.#toPerformanceQuery(
      this.toMetricToCalculateQueryForStats(stats)
    );

    const scores = await prisma.osuDroidScore.findMany(query);

    return this.getPerformanceFromScores(scores);
  }

  static async getTotalScoreBaseQuery(where: Prisma.OsuDroidScoreWhereInput) {
    const aggregate = await prisma.osuDroidScore.aggregate({
      where,
      _sum: {
        score: true,
      },
    });
    return aggregate._sum.score ?? 0;
  }

  static async getTotalRankedScore(stats: OsuDroidStatsToCalculateScores) {
    return await this.getTotalScoreBaseQuery(
      this.getRankedScoresForStatsQuery(stats)
    );
  }

  static async getTotalScore(stats: OsuDroidStatsToCalculateScores) {
    return await this.getTotalScoreBaseQuery(
      this.getScoresForStatsQuery(stats)
    );
  }

  static toTotalScoreRankQuery(
    query: NullableKeys<Prisma.OsuDroidScoreGroupByArgs, "by">
  ): MustHave<Prisma.OsuDroidScoreGroupByArgs, "orderBy"> {
    return {
      by: ["playerId", ...(query.by ?? [])],
      orderBy: {
        _sum: {
          score: Prisma.SortOrder.desc,
        },
      },
      _sum: {
        score: true,
        ...query._sum,
      },
    };
  }

  static async getGlobalRank(playerId: number, metric: number) {
    const userWhere: Prisma.OsuDroidUserWhereInput = {
      id: {
        not: playerId,
      },
    };

    let amountBetter: number;

    switch (DatabaseSetup.global_leaderboard_metric as GameMetrics) {
      case GameMetrics.pp:
        const betterUsersByPP = await prisma.osuDroidUser.findMany({
          where: userWhere,
          select: {
            scores: this.toMetricToCalculateQuery({
              select: {
                pp: true,
              },
            }),
          },
        });

        const usersScores = betterUsersByPP.map((user) => user.scores);

        amountBetter = usersScores
          .map((scores) => this.getPerformanceFromScores(scores))
          .reduce((acc, cur) => {
            return cur >= metric ? ++acc : acc;
          }, 0);

        break;
      case GameMetrics.rankedScore:
      case GameMetrics.totalScore:
        const rankByTotalScoreQuery: MustHave<
          Prisma.OsuDroidScoreGroupByArgs,
          "orderBy"
        > = this.toTotalScoreRankQuery({
          where: {
            playerId: {
              not: playerId,
            },
          },
          having: {
            score: {
              _sum: {
                gte: metric,
              },
            },
          },
        });

        switch (DatabaseSetup.global_leaderboard_metric as GameMetrics) {
          case GameMetrics.rankedScore:
            rankByTotalScoreQuery.where = {
              ...rankByTotalScoreQuery.where,
              status: {
                in: SubmissionStatusUtils.USER_BEST_STATUS,
              },
            };
        }

        const better = await prisma.osuDroidScore.groupBy(
          rankByTotalScoreQuery
        );

        amountBetter = better.length;
    }

    return amountBetter + 1;
  }

  static async getMetric(stats: OsuDroidStatsToCalculateScores) {
    switch (DatabaseSetup.global_leaderboard_metric as GameMetrics) {
      case GameMetrics.pp:
        return await this.getPerformance(stats);
      case GameMetrics.rankedScore:
        return await this.getTotalRankedScore(stats);
      case GameMetrics.totalScore:
        return await this.getTotalScore(stats);
    }
  }

  static async batchCalculate(
    stats: OsuDroidStatsToCalculateScores,
    calculate: OsuDroidStatsBatchCalculate[]
  ) {
    const query = this.toMetricToCalculateQueryForStats(stats);

    calculate.forEach((batch) => {
      switch (batch) {
        case OsuDroidStatsBatchCalculate.ACCURACY:
          OsuDroidScoreHelper.toAccuracyQuery(query);
          break;
        case OsuDroidStatsBatchCalculate.METRIC:
          switch (DatabaseSetup.global_leaderboard_metric as GameMetrics) {
            case GameMetrics.pp:
              this.#toPerformanceQuery(query);
              break;
          }
          break;
      }
    });

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
          switch (DatabaseSetup.global_leaderboard_metric as GameMetrics) {
            case GameMetrics.pp:
              response.metric = this.getPerformanceFromScores(scores);
              break;
            case GameMetrics.rankedScore:
              response.metric = await this.getTotalRankedScore(stats);
              break;
            case GameMetrics.totalScore:
              response.metric = await this.getTotalScore(stats);
              break;
          }
      }
    }

    return response;
  }
}
