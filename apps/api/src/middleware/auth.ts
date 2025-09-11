import { prisma } from '@ctm/db';
import { Elysia } from 'elysia';

export const authMiddleware = new Elysia({ name: 'auth' })
  .derive(async ({ cookie: { session } }) => {
    if (!session?.value) {
      throw new Error('No autorizado');
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
      throw new Error('Sesión expirada');
    }

    return {
      adminId: sessionRecord.adminId,
    };
  })
  .onError(({ error, set }) => {
    const errorMessage = error instanceof Error ? error.message : 'Error de autenticación';

    if (errorMessage === 'No autorizado' || errorMessage === 'Sesión expirada') {
      set.status = 401;
      return { error: errorMessage };
    }

    // Re-throw other errors
    throw error;
  });
