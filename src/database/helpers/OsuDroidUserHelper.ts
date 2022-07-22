import {
  GameMode,
  OsuDroidStats,
  OsuDroidUser,
  Prisma,
  SubmissionStatus,
  UserSession,
} from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { SubmissionStatusUtils } from "../../osu/droid/enum/SubmissionStatus";
import { AtLeast } from "../../utils/types";
import { OsuDroidScoreWithoutGenerated } from "./OsuDroidScoreHelper";
import { ServerConstants } from "../../constants";
import { addHours, addMinutes } from "date-fns";
import orderBy from "lodash.orderby";
import bcrypt from "bcrypt";

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

  static getAvatarForClient(url: string | null) {
    return (
      url ??
      `${ServerConstants.SERVER_URL}${ServerConstants.DEFAULT_AVATAR_PATH}`
    );
  }

  static async validatePassword(plain: string, encrypted: string) {
    return await bcrypt.compare(plain, encrypted);
  }

  static async deleteSession(sessionId: string) {
    /**
     * Some user actions may cause this to fail like spamming requests per example
     */
    try {
      await prisma.userSession.delete({
        where: {
          id: sessionId,
        },
      });
    } catch (e) {
      console.log(e);
    }
  }

  /**
   *
   * @param sessions existing sessions
   * @returns the existing session otherwise a new session
   */
  static async createSession(userId: number, sessions: UserSession[]) {
    const SESSION_LIMIT = 3;

    /**
     * Base session duration that is increased overtime with subsequent requests.
     */
    const SESSION_DURATION = addHours(new Date(), 12);

    /**
     * Limits to 10 concurrent sessions
     */
    if (sessions.length >= SESSION_LIMIT) {
      const sessionsOrdered = orderBy(sessions, (o) => o.expires);
      const firstSession = sessionsOrdered[0];
      await OsuDroidUserHelper.deleteSession(firstSession.id);
    }

    return await prisma.userSession.create({
      data: {
        userId,
        expires: SESSION_DURATION,
      },
    });
  }

  static toRefreshSessionQuery(
    session: AtLeast<UserSession, "expires" | "id">,
    query: Partial<Prisma.UserSessionUpdateArgs> = {}
  ): Prisma.UserSessionUpdateArgs {
    const SESSION_DURATION = addMinutes(session.expires, 30);
    return {
      where: {
        ...query.where,
        id: session.id,
      },
      data: {
        ...query.data,
        expires: SESSION_DURATION,
      },
    };
  }

  static async refreshSession(session: AtLeast<UserSession, "expires" | "id">) {
    console.log(`Refreshing session: ${session.id}`);
    /**
     *  Try catch to handle when users logout which may produce a race condition
     */
    try {
      await prisma.userSession.update(
        OsuDroidUserHelper.toRefreshSessionQuery(session)
      );
    } catch (e) {
      console.error(`Failed to refresh session: ${session.id}`);
    }
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
          /**
           * Only the best score for said map
           */
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
