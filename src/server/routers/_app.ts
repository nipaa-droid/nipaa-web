import { createRouter } from "../createRouter";
import superjson from "superjson";
import { getRankRouter } from "./getrank";
import { getTopRouter } from "./gettop";
import { submitRouter } from "./submit";
import { loginRouter } from "./login";

export const appRouter = createRouter()
  .transformer(superjson)
  .merge(getRankRouter)
  .merge(getTopRouter)
  .merge(submitRouter)
  .merge(loginRouter);

export type AppRouter = typeof appRouter;
