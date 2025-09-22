import { prisma } from '@ctm/db';
import { Elysia } from 'elysia';

export const authMiddleware = new Elysia({ name: 'auth' })
  .onBeforeHandle(async ({ cookie: { session } }) => {
    if (!session?.value) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }

    const sessionRecord = await prisma.session.findUnique({
      where: { token: session.value },
      include: { admin: true },
    });

    if (!sessionRecord || sessionRecord.expiresAt < new Date()) {
      if (sessionRecord) {
        await prisma.session.delete({
          where: { id: sessionRecord.id },
        });
      }
      return new Response(JSON.stringify({ error: 'Sesión expirada' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }

    return undefined;
  });
