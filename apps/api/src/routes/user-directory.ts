import { prisma } from '@ctm/db';
import { Elysia } from 'elysia';
import { withAuth } from '../middleware/withAuth';

export const userDirectoryRoutes = new Elysia({ prefix: '/user-directory' }).guard(
  withAuth,
  (app) =>
    app.get('/', async () => ({
      users: await prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          secondLastName: true,
          phoneMx: true,
          licenciaNum: true,
          gafeteNum: true,
          folio: true,
          vigencia: true,
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      }),
    }))
);
