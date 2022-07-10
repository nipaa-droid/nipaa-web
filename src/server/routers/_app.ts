import { createRouter } from "../createRouter";
import { getRankRouter } from "./getrank";
import { getTopRouter } from "./gettop";
import { loginRouter } from "./login";
import { playRouter } from "./play";
import { registerRouter } from "./register";
import { submitRouter } from "./submit";
import { downloadReplayRouter } from "./upload/[replayID]";

export const appRouter = createRouter()
  .merge(getRankRouter)
  .merge(getTopRouter)
  .merge(loginRouter)
  .merge(registerRouter)
  .merge(submitRouter)
  .merge(playRouter)
  .merge(downloadReplayRouter);

export type AppRouter = typeof appRouter;
