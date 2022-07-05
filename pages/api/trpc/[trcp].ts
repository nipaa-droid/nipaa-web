import { OsuDroidStats, Prisma } from "@prisma/client";
import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import assert from "assert";
import { NextApiRequest, NextApiResponse } from "next";
import { Session, unstable_getServerSession } from "next-auth";
import { resolve } from "path";
import { z } from "zod";
import { Responses } from "../../../shared/api/response/Responses";
import { DatabaseSetup } from "../../../shared/database/DatabaseSetup";
import {
  isSubmissionScoreReturnError,
  OsuDroidScoreHelper,
} from "../../../shared/database/helpers/OsuDroidScoreHelper";
import { OsuDroidStatsHelper } from "../../../shared/database/helpers/OsuDroidStatsHelper";
import { OsuDroidUserHelper } from "../../../shared/database/helpers/OsuDroidUserHelper";
import { NipaaModUtil } from "../../../shared/osu/NipaaModUtils";
import { SubmissionStatusUtils } from "../../../shared/osu_droid/enum/SubmissionStatus";
import { NonNullableRequired } from "../../../shared/utils/TypeUtils";
import { authOptions } from "../auth/[...nextauth]";

type BaseContext = {
  req: NextApiRequest;
  res: NextApiResponse;
  session: Session | null;
  errors: string[];
};

type ContextSession = NonNullable<BaseContext["session"]>;

type Context = BaseContext & {
  session: Required<ContextSession> & {
    user: NonNullableRequired<ContextSession["user"]>;
  };
};

async function createContext(
  options: trpcNext.CreateNextContextOptions
): Promise<Context> {
  const { req, res } = options;
  const session = await unstable_getServerSession(req, res, authOptions);

  let errors: string[] = [];

  if (!session) {
    errors.push("Session not found on request");
  } else if (!session.user) {
    errors.push("User not found on session");
  }

  const ctx: BaseContext = {
    req,
    res,
    session,
    errors,
  };

  assertContext(ctx);

  return ctx;
}

function assertContext(context: BaseContext): asserts context is Context {
  const { session } = context;

  assert(
    session &&
      session.user &&
      typeof session.user.email === "string" &&
      typeof session.user.name === "string" &&
      typeof session.user.image === "string"
  );
}

const idInput = z.object({
  id: z.string(),
});

const submissionPingInput = z
  .object({
    hash: z.string(),
  })
  .and(idInput);

const submissionScoreInput = z
  .object({
    data: z.string(),
  })
  .and(idInput);

export const appRouter = trpc
  .router<Context>()
  .query("submit", {
    input: submissionPingInput.or(submissionScoreInput),
    async resolve({ input, ctx }) {
      const { errors, session } = ctx;

      if (errors) {
        return Responses.FAILED(...ctx.errors);
      }

      assertContext(ctx);

      const isSubmissionPing = await submissionPingInput.safeParseAsync(input);

      if (isSubmissionPing) {
        const parsedInput = await submissionPingInput.parseAsync(input);

        const { id, hash } = parsedInput;

        const user = await prisma.osuDroidUser.findUnique({
          where: {
            id,
            email: session.user.email,
          },
          select: {
            playing: true,
          },
        });

        if (!user) {
          return Responses.FAILED(Responses.USER_NOT_FOUND);
        }

        if (user.playing !== hash) {
          await prisma.osuDroidUser.update({
            where: {
              id,
            },
            data: {
              playing: hash,
            },
          });
        }

        return Responses.SUCCESS(String(Boolean(Number(true))), id.toString());
      } else {
        const parsedInput = await submissionScoreInput.parseAsync(input);

        const { data, id } = parsedInput;

        const user = await prisma.osuDroidUser.findUnique({
          where: {
            id,
          },
          select: {
            id: true,
            username: true,
            playing: true,
            stats: {
              where: {
                mode: DatabaseSetup.game_mode,
              },
              select: {
                id: true,
                playCount: true,
              },
            },
          },
        });

        const fail = (reason: string) =>
          Responses.FAILED(`Failed to submit score. ${reason}`);

        if (!user) {
          return Responses.FAILED(Responses.USER_NOT_FOUND);
        }

        const statistics: OsuDroidStats[] = user.stats.map((s) => {
          return {
            id: s.id,
            userId: id,
            playCount: s.playCount,
            mode: DatabaseSetup.game_mode,
          };
        });

        const scoreData = await OsuDroidScoreHelper.fromSubmission(data, user);

        if (isSubmissionScoreReturnError(scoreData)) {
          return fail(scoreData.error);
        }

        const { score } = scoreData;
        const { map } = scoreData;

        if (!OsuDroidScoreHelper.isBeatmapSubmittable(map)) {
          return Responses.FAILED("Beatmap not aproved.");
        }

        const extraResponse: string[] = [];

        const canSubmit = SubmissionStatusUtils.isUserBest(score.status);

        if (canSubmit) {
          const sentScore = await prisma.osuDroidScore.create({
            data: {
              mode: score.mode,
              mapHash: score.mapHash,
              pp: score.pp,
              score: score.score,
              h300: score.h300,
              h100: score.h100,
              h50: score.h50,
              h0: score.h0,
              hGeki: score.hGeki,
              hKatu: score.hKatu,
              maxCombo: score.maxCombo,
              grade: score.grade,
              mods: score.mods,
              extra: score.extra as Prisma.InputJsonValue,
              fc: score.fc,
              status: score.status,
              playerId: score.playerId,
            },
          });
          extraResponse.push(sentScore.id.toString());
        }

        const statistic = OsuDroidUserHelper.getStatistic(
          statistics,
          score.mode
        );

        if (!statistic) {
          return fail("User statistics not found.");
        }

        OsuDroidUserHelper.submitScore(statistic, score);

        await prisma.osuDroidStats.update({
          where: {
            id: statistic.id,
          },
          data: {
            playCount: statistic.playCount,
          },
        });

        const userRank = await OsuDroidStatsHelper.getGlobalRank(statistic);
        const metric = await OsuDroidStatsHelper.getRoundedMetric(statistic);
        const accuracy = await OsuDroidStatsHelper.getAccuracy(statistic);
        const scoreRank = await OsuDroidScoreHelper.getPlacement(score);

        const response: string[] = [
          userRank.toString(),
          metric.toString(),
          accuracy.toString(),
          scoreRank.toString(),
          ...extraResponse,
        ];

        return Responses.SUCCESS(...response);
      }
    },
  })
  .query("gettop", {
    input: z.object({
      playID: z.string(),
    }),
    async resolve({ input }) {
      const { playID } = input;

      const score = await prisma.osuDroidScore.findUnique({
        where: {
          id: playID,
        },
        include: {
          player: {
            select: {
              username: true,
            },
          },
        },
      });

      if (!score || !score.player) {
        return Responses.FAILED("Score not found.");
      }

      const accuracy = OsuDroidScoreHelper.getAccuracyDroid(score);

      return Responses.SUCCESS(
        NipaaModUtil.droidStringFromScore(score),
        OsuDroidScoreHelper.getRoundedMetric(score).toString(),
        score.maxCombo.toString(),
        score.grade.toString(),
        score.hGeki.toString(),
        score.h300.toString(),
        score.hKatu.toString(),
        score.h100.toString(),
        score.h50.toString(),
        score.h0.toString(),
        accuracy.toString(),
        score.date.getTime().toString(),
        Number(score.fc).toString(),
        score.player.username
      );
    },
  });

// export type definition of API
export type AppRouter = typeof appRouter;

// export API handler
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext,
});
