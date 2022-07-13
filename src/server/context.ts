import * as trpcNext from "@trpc/server/adapters/next";
import * as trpc from "@trpc/server";

export async function createContext(
  _options: trpcNext.CreateNextContextOptions
) {
  return {};
}

export type Context = trpc.inferAsyncReturnType<typeof createContext>;
