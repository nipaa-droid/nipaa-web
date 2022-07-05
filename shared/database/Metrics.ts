export enum Metrics {
  pp = "pp",
  rankedScore = "rankedScore",
  totalScore = "totalScore",
}

export type PPMetrics = Metrics.pp;
export type ScoreMetrics = Metrics.rankedScore | Metrics.totalScore;

export type MetricKeys = {
  [K in keyof typeof Metrics]: typeof Metrics[K];
};

export type ObjectWithMetrics<T = number> = {
  [K in Metrics]: T;
};
