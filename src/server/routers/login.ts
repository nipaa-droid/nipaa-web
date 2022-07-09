import { HTTPMethod } from "../../http/HTTPMethod";
import { createRouter } from "../createRouter";
import { protectRouteWithMethods } from "../middlewares";
import { prisma } from "../../../lib/prisma";
import { Responses } from "../../api/Responses";
import { Prisma } from "@prisma/client";
import {
  OsuDroidStatsBatchCalculate,
  OsuDroidStatsHelper,
} from "../../database/helpers/OsuDroidStatsHelper";
import { DatabaseSetup } from "../../database/DatabaseSetup";
import { OsuDroidUserHelper } from "../../database/helpers/OsuDroidUserHelper";
import { v4 } from "uuid";
import bcrypt from "bcrypt";
import { schemaWithUsernameWithPassword } from "../schemas";

export const loginRouter = protectRouteWithMethods(createRouter(), [
  HTTPMethod.POST,
]).mutation("login", {
  input: schemaWithUsernameWithPassword,
  async resolve({ input }) {
    const { username, password } = input;

    const userWhere: Prisma.OsuDroidUserWhereUniqueInput = {
      name: username,
    };

    const user = await prisma.osuDroidUser.findFirst({
      where: userWhere,
      select: {
        id: true,
        name: true,
        image: true,
        password: true,
        stats: {
          where: {
            mode: DatabaseSetup.game_mode,
          },
        },
      },
    });

    if (!user) {
      return Responses.FAILED(Responses.USER_NOT_FOUND);
    }

    const verify = await bcrypt.compare(password, user.password);

    if (!verify) {
      return Responses.FAILED("Wrong password");
    }

    const session = v4();

    await prisma.osuDroidUser.update({
      where: userWhere,
      data: {
        lastSeen: new Date(),
        session,
      },
    });

    const statistic = OsuDroidUserHelper.getStatistic(
      user.stats,
      DatabaseSetup.game_mode
    );

    if (!statistic) {
      return Responses.FAILED(Responses.USER_NOT_FOUND);
    }

    const { metric, accuracy } = await OsuDroidStatsHelper.batchCalculate(
      statistic,
      [OsuDroidStatsBatchCalculate.METRIC, OsuDroidStatsBatchCalculate.ACCURACY]
    );

    const rank = await OsuDroidStatsHelper.getGlobalRank(user.id, metric);

    return Responses.SUCCESS(
      user.id.toString(),
      session.toString(),
      rank.toString(),
      Math.round(metric).toString(),
      accuracy.toString(),
      user.name,
      OsuDroidUserHelper.getImage(user.image)
    );
  },
});
