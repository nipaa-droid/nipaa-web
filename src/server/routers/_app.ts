import { createRouter } from "../createRouter";
import { clientGetRankRouter } from "./client/getrank";
import { clientGetTopRouter } from "./client/gettop";
import { clientGetLoginRouter } from "./client/login";
import { clientGetPlayRouter } from "./client/play";
import { clientGetRegisterRouter } from "./client/register";
import { clientGetSubmitRouter } from "./client/submit";
import { trpcGlobalLeaderboardRouter } from "./backend/global_leaderboard";
import { cron1DayRouter } from "./backend/cron1day";
import { webLoginRouter } from "./web/login";
import { webGetUserInformationFromSession } from "./web/session_user";
import { webLogoutRouter } from "./web/logout";
import { cron1hourRouter } from "./backend/cron1hour";
import { webRefreshmentEndpoint } from "./web/refresh";

export const appRouter = createRouter()
  .merge(clientGetRankRouter)
  .merge(clientGetTopRouter)
  .merge(clientGetLoginRouter)
  .merge(clientGetRegisterRouter)
  .merge(clientGetSubmitRouter)
  .merge(clientGetPlayRouter)
  .merge(trpcGlobalLeaderboardRouter)
  .merge(cron1DayRouter)
  .merge(webLoginRouter)
  .merge(webGetUserInformationFromSession)
  .merge(webLogoutRouter)
  .merge(cron1hourRouter)
  .merge(webRefreshmentEndpoint);

export type AppRouter = typeof appRouter;
