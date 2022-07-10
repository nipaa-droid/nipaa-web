import { Prisma, PrismaClient } from "@prisma/client";
import { minutesToMilliseconds } from "date-fns";
import { createPrismaRedisCache } from "prisma-redis-middleware";

const prisma = new PrismaClient();

const cacheMiddleware = createPrismaRedisCache({
  storage: {
    type: "memory",
    options: {
      invalidation: true,
      log: console,
    },
  },
  cacheTime: minutesToMilliseconds(1),
  onHit: (key) => console.log(`Got from cache ${key}`),
}) as Prisma.Middleware;

prisma.$use(cacheMiddleware);

export { prisma };
