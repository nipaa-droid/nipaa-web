import { Prisma, PrismaClient } from "@prisma/client";
import { secondsToMilliseconds } from "date-fns";
import { createPrismaRedisCache } from "prisma-redis-middleware";

const prisma = new PrismaClient();

const cacheMiddleware = createPrismaRedisCache({
  storage: {
    type: "memory",
    options: {
      invalidation: true,
    },
  },
  cacheTime: secondsToMilliseconds(3),
  onHit: (key) => console.log(`Got from cache ${key}`),
}) as Prisma.Middleware;

prisma.$use(cacheMiddleware);

export { prisma };
