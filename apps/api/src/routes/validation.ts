import { prisma } from '@ctm/db';
import { Elysia } from 'elysia';

export const validationRoutes = new Elysia({ prefix: '/users' })
  .get('/:id/validate', async ({ params: { id }, set }) => {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        secondLastName: true,
        vigencia: true,
      },
    });

    if (!user) {
      set.status = 404;
      return { error: 'Usuario no encontrado' };
    }

    return { user };
  });
