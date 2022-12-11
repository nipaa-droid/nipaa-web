import { createRouter, toApiClientTrpc, toApiEndpoint, } from "../../createRouter";
import { prisma } from "../../../../lib/prisma";
import { Responses } from "../../../api/Responses";
import { Prisma } from "@prisma/client";
import { OsuDroidStatsBatchCalculate, OsuDroidStatsHelper, } from "../../../database/helpers/OsuDroidStatsHelper";
import { GameRules } from "../../../database/GameRules";
import { OsuDroidUserHelper } from "../../../database/helpers/OsuDroidUserHelper";
import { z } from "zod";
import { shapeWithUsernameWithPassword } from "../../shapes";
import { putSessionCookie } from "../../utils";
import { commonRequestMiddleware } from "../../middlewares";

const path = "login";

export const clientGetLoginRouter = commonRequestMiddleware(
	createRouter()
).mutation(toApiClientTrpc(path), {
	meta: {
		openapi: {
			enabled: true,
			method: "POST",
			path: toApiEndpoint(path),
		},
	},
	input: z.object({ ...shapeWithUsernameWithPassword }),
	output: z.string(),
	async resolve({ input, ctx }) {
		const { username, password } = input;
		
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
			return Responses.FAILED(Responses.USER_NOT_FOUND);
		}
		
		const verify = await OsuDroidUserHelper.validatePassword(
			password,
			user.password
		);
		
		if (!verify) {
			return Responses.FAILED("Wrong password");
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
			return Responses.FAILED(Responses.USER_NOT_FOUND);
		}
		
		const { metric, accuracy } = await OsuDroidStatsHelper.batchCalculate(
			statistic,
			[OsuDroidStatsBatchCalculate.METRIC, OsuDroidStatsBatchCalculate.ACCURACY]
		);
		
		const rank = await OsuDroidStatsHelper.getGlobalRank(user.id, metric);
		
		putSessionCookie(ctx, session);
		
		return Responses.SUCCESS(
			user.id.toString(),
			session.id.toString(),
			rank.toString(),
			Math.round(metric).toString(),
			Math.round(accuracy).toString(),
			user.name,
			OsuDroidUserHelper.getAvatarForClient(user.image)
		);
	},
});
