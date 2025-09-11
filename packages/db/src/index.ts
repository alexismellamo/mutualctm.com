import { PrismaClient } from '@prisma/client';

// Augment globalThis to include our Prisma instance
declare global {
  namespace globalThis {
    var __prisma: PrismaClient | undefined;
  }
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!globalThis.__prisma) {
    globalThis.__prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = globalThis.__prisma;
}

export { prisma };
export * from '@prisma/client';
