import { Prisma, PrismaClient } from "@prisma/client";
import { createPrismaRedisCache } from "prisma-redis-middleware";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

const prisma = new PrismaClient();

if (process.env.NODE_ENV === "production") {
  const TTL = 3000;
  const cacheMiddleware = createPrismaRedisCache({
    storage: {
      type: "redis",
      options: {
        client: redis,
        invalidation: {
          referencesTTL: TTL,
        },
      },
    },
    cacheTime: TTL,
    onHit: (key) => console.log(`Got from cache ${key}`),
  }) as Prisma.Middleware;

  prisma.$use(cacheMiddleware);
}

export { prisma };
