import { OsuDroidScore, OsuDroidStats, Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { AccuracyUtils } from "../../osu/droid/AccuracyUtils";
import { SubmissionStatusUtils } from "../../osu/droid/enum/SubmissionStatus";
import { AtLeast, MustHave, UndefinableKeys } from "../../utils/types";
import { GameRules } from "../GameRules";
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
  static toScoresForStatsQuery(
    query: Prisma.OsuDroidScoreWhereInput,
    stats: OsuDroidStatsToCalculateScores
  ) {
    return {
      ...query,
      playerId: stats.userId,
      mode: stats.mode,
    };
  }

  static toRankedScoresForStatsQuery(
    query: Prisma.OsuDroidScoreWhereInput,
    stats: OsuDroidStatsToCalculateScores
  ) {
    return this.toScoresForStatsQuery(
      {
        ...query,
        ...{
          status: {
            ...(typeof query.status === "object" ? query.status : {}),
            in: SubmissionStatusUtils.GLOBAL_RANKED_STATUS,
          },
        },
      },
      stats
    );
  }

  static toMetricToCalculateQuery(
    query: Prisma.OsuDroidScoreFindManyArgs
  ): Prisma.OsuDroidScoreFindManyArgs {
    return {
      ...query,
      distinct: ["beatmapDatabaseId"],
      where: {
        ...query.where,
        status: {
          ...(typeof query.where?.status === "object"
            ? query.where.status
            : {}),
          in: SubmissionStatusUtils.GLOBAL_RANKED_STATUS,
        },
      },
      take: 100,
      orderBy: {
        ...query.orderBy,
        pp: Prisma.SortOrder.desc,
      },
    };
  }

  static toMetricToCalculateQueryForStats(
    query: Prisma.OsuDroidScoreFindManyArgs,
    stats: OsuDroidStatsToCalculateScores
  ): Prisma.OsuDroidScoreFindManyArgs {
    return this.toMetricToCalculateQuery({
      ...query,
      where: this.toScoresForStatsQuery({ ...query.where }, stats),
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
    const query = this.toMetricToCalculateQueryForStats(
      {
        select: OsuDroidScoreHelper.toAccuracySelect({}),
      },
      stats
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

  static toPerformanceQuery(query: Prisma.OsuDroidScoreFindManyArgs) {
    return this.toMetricToCalculateQuery({
      ...query,
      select: {
        ...query.select,
        pp: true,
      },
    });
  }

  static async getPerformance(stats: OsuDroidStatsToCalculateScores) {
    const query = this.toPerformanceQuery(
      this.toMetricToCalculateQueryForStats({}, stats)
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
      this.toRankedScoresForStatsQuery({}, stats)
    );
  }

  static async getTotalScore(stats: OsuDroidStatsToCalculateScores) {
    return await this.getTotalScoreBaseQuery(
      this.toScoresForStatsQuery({}, stats)
    );
  }

  static toTotalScoreRankQuery(
    query: UndefinableKeys<Prisma.OsuDroidScoreGroupByArgs, "by">
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

    switch (GameRules.global_leaderboard_metric as GameMetrics) {
      case GameMetrics.pp:
        const betterUsersByPP = await prisma.osuDroidUser.findMany({
          where: userWhere,
          select: {
            scores: this.toPerformanceQuery({}),
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

        switch (GameRules.global_leaderboard_metric as GameMetrics) {
          case GameMetrics.rankedScore:
            rankByTotalScoreQuery.where = {
              ...rankByTotalScoreQuery.where,
              status: {
                in: SubmissionStatusUtils.GLOBAL_RANKED_STATUS,
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
    switch (GameRules.global_leaderboard_metric as GameMetrics) {
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
    let query = this.toMetricToCalculateQueryForStats({}, stats);

    calculate.forEach((batch) => {
      switch (batch) {
        case OsuDroidStatsBatchCalculate.ACCURACY:
          query.select = OsuDroidScoreHelper.toAccuracySelect(
            query.select ?? {}
          );
          break;
        case OsuDroidStatsBatchCalculate.METRIC:
          switch (GameRules.global_leaderboard_metric as GameMetrics) {
            case GameMetrics.pp:
              query = this.toPerformanceQuery(query);
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
          switch (GameRules.global_leaderboard_metric as GameMetrics) {
            case GameMetrics.pp:
              response.metric = this.getPerformanceFromScores(scores);
              break;
            /**
             * TODO These await are inneficient as hell fix.
             * u already have the scores bro
             */
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
