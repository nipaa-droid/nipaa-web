import * as trpcNext from "@trpc/server/adapters/next";
import * as trpc from "@trpc/server";

export async function createContext({
  req,
  res,
}: trpcNext.CreateNextContextOptions) {
  return { req, res };
}

export type Context = trpc.inferAsyncReturnType<typeof createContext>;
