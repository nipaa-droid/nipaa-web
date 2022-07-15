import {
  GameMode,
  OsuDroidStats,
  OsuDroidUser,
  Prisma,
  SubmissionStatus,
} from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { SubmissionStatusUtils } from "../../osu/droid/enum/SubmissionStatus";
import { AtLeast } from "../../utils/types";
import { OsuDroidScoreWithoutGenerated } from "./OsuDroidScoreHelper";
import { v4 } from "uuid";
import { ServerConstants } from "../../constants";

export type UserWithStats = OsuDroidUser & {
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

  static getImage(url: string | null) {
    return url ?? ServerConstants.DEFAULT_AVATAR_PATH;
  }

  /**
   *
   * @param session an existing session or not
   * @returns the existing session otherwise a new session
   */
  static async createSession(session: string | null, id: number) {
    if (!session) {
      session = v4();
    }

    await prisma.osuDroidUser.update({
      where: {
        id,
      },
      data: {
        session,
        lastSeen: new Date(),
      },
    });

    return session;
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
    return await prisma.osuDroidScore.findFirst({
      ...{
        where: {
          playerId,
          mapHash,
          mode,
          status: { in: SubmissionStatusUtils.USER_BEST_STATUS },
        },
      },
      ...options,
    });
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
