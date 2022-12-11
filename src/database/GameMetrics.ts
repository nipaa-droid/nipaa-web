export enum GameMetrics {
  pp = "pp",
  rankedScore = "rankedScore",
  totalScore = "totalScore",
}

export type GameMetricKeys = "pp" | "rankedScore" | "totalScore";

export type PPMetrics = GameMetrics.pp;
export type ScoreMetrics = GameMetrics.rankedScore | GameMetrics.totalScore;

export type ObjectWithGameMetrics<T = number> = {
  [K in GameMetrics]: T;
};
