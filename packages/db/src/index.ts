import { PrismaClient } from '@prisma/client';

declare global {
  // biome-ignore lint/style/noVar: Global declaration needs var
  var __prisma: PrismaClient | undefined;
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

