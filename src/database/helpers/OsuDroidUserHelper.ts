import {
  GameMode,
  OsuDroidStats,
  Prisma,
  SubmissionStatus,
  User,
} from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { SubmissionStatusUtils } from "../../osu_droid/enum/SubmissionStatus";
import { AtLeast } from "../../utils/TypeUtils";
import { OsuDroidScoreWithoutGenerated } from "./OsuDroidScoreHelper";

export type UserWithStats = User & {
  stats: OsuDroidStats[];
};

export type UserWithAtLeastStats = AtLeast<UserWithStats, "stats">;

type OsuDroidStatsWithAtLeastMode = AtLeast<OsuDroidStats, "mode">;

export class OsuDroidUserHelper {
  static getStatistic<
    T extends OsuDroidStatsWithAtLeastMode = OsuDroidStatsWithAtLeastMode
  >(statistics: T[], mode: GameMode) {
    return statistics.find((s) => s.mode === mode);
  }

  /**
   * return the best score made by this user on the selected {@link mapHash}'s beatmap.
   * @param mapHash The beatmap hash to get the best score from.
   */
  static async getBestScoreOnBeatmap(
    playerId: number,
    mapHash: string,
    mode: GameMode,
    options?: Prisma.OsuDroidScoreArgs
  ) {
    const query: Prisma.OsuDroidScoreFindFirstArgs = {
      where: {
        playerId,
        mapHash,
        mode,
        status: { in: SubmissionStatusUtils.USER_BEST_STATUS },
      },
    };

    if (options) {
      query.select = options.select;
      query.include = options.include;
    }

    return await prisma.osuDroidScore.findFirst(query);
  }

  static async submitScore(
    statistic: AtLeast<OsuDroidStats, "mode" | "playCount">,
    score: OsuDroidScoreWithoutGenerated
  ) {
    if (score.status === SubmissionStatus.FAILED) {
      throw "Can't submit a score which it's status is failed.";
    }

    statistic.playCount++;
  }
}
