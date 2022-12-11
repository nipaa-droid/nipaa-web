import { createSSGHelpers } from "@trpc/react/ssg";
import { Context } from "../server/context";
import { appRouter } from "../server/routers/_app";

export const getSSGHelper = (context: Context) => {
	return createSSGHelpers({
		router: appRouter,
		ctx: context,
	});
};
