import { Prisma, PrismaClient } from "@prisma/client";
import { createPrismaRedisCache } from "prisma-redis-middleware";

const prisma = new PrismaClient();

const cacheMiddleware = createPrismaRedisCache({
  storage: {
    type: "memory",
    options: {
      invalidation: true,
    },
  },
  cacheTime: 3000,
  onHit: (key) => console.log(`Got from cache ${key}`),
}) as Prisma.Middleware;

prisma.$use(cacheMiddleware);

export { prisma };
