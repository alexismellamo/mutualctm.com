import { prisma } from '@ctm/db';
import { Elysia } from 'elysia';

export const healthRoutes = new Elysia({ prefix: '/health' }).get('/', async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

