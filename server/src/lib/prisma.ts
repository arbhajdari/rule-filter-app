import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton.
 * In development, we attach the client to the 'global' object to prevent
 * multiple hot-reloads from exhausting the database connection pool.
 */
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}