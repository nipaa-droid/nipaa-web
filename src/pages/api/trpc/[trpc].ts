import { PrismaAdapter } from "@next-auth/prisma-adapter";
import * as trpcNext from "@trpc/server/adapters/next";
import { createContext } from "../../../server/context";
import { appRouter } from "../../../server/routers/_app";

export default trpcNext.createNextApiHandler({
  adapter: PrismaAdapter(prisma),
  router: appRouter,
  createContext,
});
