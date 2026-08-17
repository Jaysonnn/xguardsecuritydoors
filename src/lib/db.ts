import { PrismaClient } from "@prisma/client";

/**
 * Prisma singleton, which avoids connection-pool exhaustion from hot-reload in dev.
 * All queries through Prisma are parameterised; never use $queryRawUnsafe.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
