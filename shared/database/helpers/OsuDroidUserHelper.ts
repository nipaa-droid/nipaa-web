import {
  GameMode,
  OsuDroidStats,
  OsuDroidUser,
  Prisma,
  SubmissionStatus,
} from "@prisma/client";
import assert from "assert";
import { SubmissionStatusUtils } from "../../osu_droid/enum/SubmissionStatus";
import { AtLeast } from "../../utils/TypeUtils";
import { OsuDroidScoreWithoutGenerated } from "./OsuDroidScoreHelper";

export type UserWithStats = OsuDroidUser & {
  stats: OsuDroidStats[];
};

export type UserWithAtLeastStats = AtLeast<UserWithStats, "stats">;

export class OsuDroidUserHelper {
  static getStatistic(user: UserWithAtLeastStats, mode: GameMode) {
    return user.stats.find((s) => s.mode === mode);
  }

  /**
   * return the best score made by this user on the selected {@link mapHash}'s beatmap.
   * @param mapHash The beatmap hash to get the best score from.
   */
  static async getBestScoreOnBeatmap(
    playerId: number,
    mapHash: string,
    options?: Prisma.OsuDroidScoreArgs
  ) {
    const query: Prisma.OsuDroidScoreFindFirstArgs = {
      where: {
        playerId,
        mapHash,
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
    user: AtLeast<OsuDroidUser, "id"> & UserWithAtLeastStats,
    score: OsuDroidScoreWithoutGenerated
  ) {
    if (score.status === SubmissionStatus.FAILED) {
      throw "Can't submit a score which it's status is failed.";
    }

    const statistic = this.getStatistic(user, score.mode);

    assert(statistic);

    statistic.playCount++;
  }
}
