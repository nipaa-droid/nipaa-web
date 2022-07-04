export enum Metrics {
  pp = "pp",
  rankedScore = "rankedScore",
  totalScore = "totalScore",
}

export type PPMetrics = Metrics.pp;
export type ScoreMetrics = Metrics.rankedScore | Metrics.totalScore;
export type AnyMetrics = PPMetrics | ScoreMetrics;

export type ObjectWithMetrics<T = number> = {
  [K in Metrics]: T;
};
