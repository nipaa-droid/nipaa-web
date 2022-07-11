import { createRouter } from "../createRouter";
import { clientGetRankRouter } from "./client/getrank";
import { clientGetTopRouter } from "./client/gettop";
import { clientGetLoginRouter } from "./client/login";
import { clientGetPlayRouter } from "./client/play";
import { clientGetRegisterRouter } from "./client/register";
import { clientGetSubmitRouter } from "./client/submit";
import { trpcGlobalLeaderboardRouter } from "./trpc/globalLeaderboard";

export const appRouter = createRouter()
  .merge(clientGetRankRouter)
  .merge(clientGetTopRouter)
  .merge(clientGetLoginRouter)
  .merge(clientGetRegisterRouter)
  .merge(clientGetSubmitRouter)
  .merge(clientGetPlayRouter)
  .merge(trpcGlobalLeaderboardRouter);

export type AppRouter = typeof appRouter;
