import { HTTPMethod } from "../../http/HttpMethod";
import { createRouter } from "../createRouter";
import { z } from "zod";
import {
  protectRouteWithAuthentication,
  protectRouteWithMethods,
} from "../middlewares";
import { prisma } from "../../../lib/prisma";
import * as trpc from "@trpc/server";
import { Responses } from "../../api/Responses";
import { Prisma } from "@prisma/client";
import { OsuDroidStatsHelper } from "../../database/helpers/OsuDroidStatsHelper";
import { DatabaseSetup } from "../../database/DatabaseSetup";
import { OsuDroidUserHelper } from "../../database/helpers/OsuDroidUserHelper";

export const loginRouter = protectRouteWithAuthentication(
  protectRouteWithMethods(createRouter(), [HTTPMethod.POST])
).query("login", {
  input: z.object({
    username: z.string(),
    password: z.string(),
  }),
  async resolve({ input, ctx }) {
    if (input.username !== ctx.session.user.name) {
      throw new trpc.TRPCError({ code: "UNAUTHORIZED" });
    }

    const userWhere: Prisma.UserWhereUniqueInput = {
      name: ctx.session.user.name,
    };

    const user = await prisma.user.findFirst({
      where: userWhere,
      select: {
        id: true,
        name: true,
        stats: true,
      },
    });

    if (!user) {
      return Responses.FAILED(Responses.USER_NOT_FOUND);
    }

    await prisma.user.update({
      where: userWhere,
      data: {
        lastSeen: new Date(),
      },
    });

    const statistic = OsuDroidUserHelper.getStatistic(
      user.stats,
      DatabaseSetup.game_mode
    );

    if (!statistic) {
      return Responses.FAILED(Responses.USER_NOT_FOUND);
    }

    const rank = await OsuDroidStatsHelper.getGlobalRank(statistic);

    const metric = await OsuDroidStatsHelper.getRoundedMetric(statistic);

    const accuracy = await OsuDroidStatsHelper.getAccuracy(statistic);

    return Responses.SUCCESS(
      user.id.toString(),
      (69420).toString(),
      rank.toString(),
      metric.toString(),
      accuracy.toString(),
      user.name,
      ctx.session.user.image
    );
  },
});
