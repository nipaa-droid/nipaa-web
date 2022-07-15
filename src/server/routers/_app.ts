import { createRouter } from "../createRouter";
import { clientGetRankRouter } from "./client/getrank";
import { clientGetTopRouter } from "./client/gettop";
import { clientGetLoginRouter } from "./client/login";
import { clientGetPlayRouter } from "./client/play";
import { clientGetRegisterRouter } from "./client/register";
import { clientGetSubmitRouter } from "./client/submit";
import { trpcGlobalLeaderboardRouter } from "./backend/global_leaderboard";
import { cron1DayRouter } from "./backend/cron1day";
import { trpcLoginRouter } from "./backend/login";
import { trpcGetUserInformationFromSession } from "./backend/get_user_from_session";

export const appRouter = createRouter()
  .merge(clientGetRankRouter)
  .merge(clientGetTopRouter)
  .merge(clientGetLoginRouter)
  .merge(clientGetRegisterRouter)
  .merge(clientGetSubmitRouter)
  .merge(clientGetPlayRouter)
  .merge(trpcGlobalLeaderboardRouter)
  .merge(cron1DayRouter)
  .merge(trpcLoginRouter)
  .merge(trpcGetUserInformationFromSession);

export type AppRouter = typeof appRouter;
