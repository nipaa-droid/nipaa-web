import { GameMode } from "@prisma/client";
import { GameMetrics } from "./GameMetrics";

export type ActiveGlobalLeaderboardMetric = GameMetrics.pp;

export enum OsuDroidScoreMetric {
	score = "score",
	pp = "pp",
}

export type ActiveScoreLeaderboardMetric = OsuDroidScoreMetric.pp;

export class GameRules {
	static game_mode = GameMode.std;
	static global_leaderboard_metric: ActiveGlobalLeaderboardMetric =
		GameMetrics.pp;
	static score_leaderboard_metric: ActiveScoreLeaderboardMetric =
		OsuDroidScoreMetric.pp;
}
