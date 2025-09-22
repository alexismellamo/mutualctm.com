import { prisma } from '@ctm/db';
import { loginSchema } from '@ctm/schema';
import { verify } from 'argon2';
import { Elysia, t } from 'elysia';
import { withAuth } from '../middleware/withAuth';

function generateSessionToken(): string {
  return crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
}

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post(
    '/login',
    async ({ body, set, cookie: { session }, request }) => {
      const _clientIP = request.headers.get('x-forwarded-for') || 'unknown';

      try {
        const { email, password } = loginSchema.parse(body);

        const admin = await prisma.admin.findUnique({
          where: { email },
        });

        if (!admin || !(await verify(admin.password, password))) {
          set.status = 401;
          return { error: 'Credenciales inválidas' };
        }

        await prisma.session.deleteMany({
          where: {
            adminId: admin.id,
            expiresAt: { lt: new Date() },
          },
        });

        const sessionToken = generateSessionToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await prisma.session.create({
          data: {
            token: sessionToken,
            adminId: admin.id,
            expiresAt,
          },
        });

        session.set({
          value: sessionToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          expires: expiresAt,
          path: '/',
        });

        return {
          message: 'Login exitoso',
          admin: {
            id: admin.id,
            email: admin.email,
          },
        };
      } catch (error) {
        set.status = 400;
        return {
          error: error instanceof Error ? error.message : 'Error de validación',
        };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .group('', (app) =>
    app
      .post(
        '/logout',
        async ({ cookie: { session } }) => {
          if (session?.value) {
            await prisma.session.deleteMany({
              where: { token: session.value },
            });

            session.remove();
          }

          return { message: 'Logout exitoso' };
        },
        withAuth
      )
      .get(
        '/me',
        async ({ cookie: { session }, set }) => {
          const adminSession = await prisma.session.findUnique({
            where: { token: session.value },
            include: { admin: true },
          });

          if (!adminSession) {
            set.status = 401;
            return { error: 'No autorizado' };
          }

          const admin = await prisma.admin.findUnique({
            where: { id: adminSession.adminId },
            select: {
              id: true,
              email: true,
              createdAt: true,
            },
          });

          if (!admin) {
            set.status = 404;
            return { error: 'Admin no encontrado' };
          }

          return { admin };
        },
        withAuth
      )
  );
