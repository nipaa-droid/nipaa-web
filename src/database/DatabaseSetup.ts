import { GameMode } from "@prisma/client";
import { Metrics } from "./Metrics";

export type ActiveGlobalLeaderboardMetric = Metrics.totalScore;

export enum OsuDroidScoreMetric {
  score = "score",
  pp = "pp",
}

export type ActiveScoreLeaderboardMetric = OsuDroidScoreMetric.score;

export class DatabaseSetup {
  static game_mode = GameMode.std;
  static global_leaderboard_metric: ActiveGlobalLeaderboardMetric =
    Metrics.totalScore;
  static score_leaderboard_metric: ActiveScoreLeaderboardMetric =
    OsuDroidScoreMetric.score;
}
