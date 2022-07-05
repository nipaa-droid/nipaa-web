import { unstable_getServerSession } from "next-auth";
import { authOptions } from "../../pages/api/auth/[...nextauth]";
import * as trpcNext from "@trpc/server/adapters/next";
import * as trpc from "@trpc/server";

export async function createContext(
  options: trpcNext.CreateNextContextOptions
) {
  const { req, res } = options;

  const session = await unstable_getServerSession(req, res, authOptions);

  return {
    req,
    res,
    session,
  };
}

export type Context = trpc.inferAsyncReturnType<typeof createContext>;
