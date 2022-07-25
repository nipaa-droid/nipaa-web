import { createRouter } from "../../createRouter";
import { prisma } from "../../../../lib/prisma";
import { Responses } from "../../../api/Responses";
import { Prisma } from "@prisma/client";
import {
  OsuDroidStatsBatchCalculate,
  OsuDroidStatsHelper,
} from "../../../database/helpers/OsuDroidStatsHelper";
import { GameRules } from "../../../database/GameRules";
import { OsuDroidUserHelper } from "../../../database/helpers/OsuDroidUserHelper";
import { z, ZodObject } from "zod";
import { shapeWithUsernameWithPassword } from "../../shapes";
import { putSessionCookie } from "../../utils";
import { commonRequestMiddleware } from "../../middlewares";
import { CommonRequest } from "../../context";
import { ObjectWithContext } from "../../../utils/trpc";

export const clientGetLoginRouter = commonRequestMiddleware(
  createRouter()
).mutation("client-login", {
  meta: {
    openapi: {
      enabled: true,
      method: "POST",
      path: "/login",
    },
  },
  input: z.object({ ...shapeWithUsernameWithPassword }),
  output: z.string(),
  async resolve({ input, ctx }) {
    const { username, password } = input;
    return await clientLoginResolverWithContext({ username, password, ctx });
  },
});

type ResolverInput<S extends Prisma.OsuDroidUserSelect> = z.infer<
  ZodObject<typeof shapeWithUsernameWithPassword>
> & { select?: S };

export const clientLoginResolver = async <S extends Prisma.OsuDroidUserSelect>({
  username,
  password,
  select,
}: ResolverInput<S>) => {
  const userWhere: Prisma.OsuDroidUserWhereUniqueInput = {
    name: username,
  };

  const user = await prisma.osuDroidUser.findUnique({
    where: userWhere,
    select: {
      id: true,
      name: true,
      image: true,
      password: true,
      sessions: true,
      stats: {
        where: {
          mode: GameRules.game_mode,
        },
      },
    },
  });

  if (!user) {
    return {
      response: Responses.FAILED(Responses.USER_NOT_FOUND),
    };
  }

  const verify = await OsuDroidUserHelper.validatePassword(
    password,
    user.password
  );

  if (!verify) {
    return {
      response: Responses.FAILED("Wrong password"),
    };
  }

  const session = await OsuDroidUserHelper.createSession(
    user.id,
    user.sessions
  );

  const statistic = OsuDroidUserHelper.getStatistic(
    user.stats,
    GameRules.game_mode
  );

  if (!statistic) {
    return { response: Responses.FAILED(Responses.USER_NOT_FOUND) };
  }

  const { metric, accuracy } = await OsuDroidStatsHelper.batchCalculate(
    statistic,
    [OsuDroidStatsBatchCalculate.METRIC, OsuDroidStatsBatchCalculate.ACCURACY]
  );

  const rank = await OsuDroidStatsHelper.getGlobalRank(user.id, metric);

  return {
    response: Responses.SUCCESS(
      user.id.toString(),
      session.id.toString(),
      rank.toString(),
      Math.round(metric).toString(),
      Math.round(accuracy).toString(),
      user.name,
      OsuDroidUserHelper.getAvatarForClient(user.image)
    ),
    session,
  };
};

export const clientLoginResolverWithContext = async <
  S extends Prisma.OsuDroidUserSelect
>({
  username,
  password,
  ctx,
}: ResolverInput<S> & ObjectWithContext<CommonRequest>) => {
  const result = await clientLoginResolver({ username, password });
  const { session } = result;

  if (session) {
    putSessionCookie(ctx, session);
  }

  return result.response;
};
