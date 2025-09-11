import { prisma } from '@ctm/db';
import {
  applyVigencySchema,
  createUserSchema,
  searchUsersSchema,
  updateUserSchema,
} from '@ctm/schema';
import type { Address, User } from '@prisma/client';
import { Elysia, t } from 'elysia';
import { authMiddleware } from '../middleware/auth';

export const usersRoutes = new Elysia({ prefix: '/users' })
  .use(authMiddleware)
  .post(
    '/',
    async ({ body, set }) => {
      try {
        const data = createUserSchema.parse(body);
        const { address, ...userData } = data;

        const user = await prisma.user.create({
          data: {
            ...userData,
            address: {
              create: address,
            },
          },
          include: {
            address: true,
          },
        });

        return {
          message: 'Usuario creado exitosamente',
          user,
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
        firstName: t.String(),
        lastName: t.String(),
        secondLastName: t.Optional(t.String()),
        dob: t.String(),
        vigencia: t.Optional(t.String()),
        phoneMx: t.String(),
        credencialNum: t.String(),
        gafeteNum: t.String(),
        address: t.Object({
          street: t.String(),
          exteriorNo: t.Optional(t.String()),
          interiorNo: t.Optional(t.String()),
          neighborhood: t.String(),
          city: t.String(),
          municipality: t.String(),
          state: t.String(),
          postalCode: t.String(),
          references: t.Optional(t.String()),
        }),
      }),
    }
  )
  .get('/:id', async ({ params: { id }, set }) => {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        address: true,
        vigencyEvents: {
          orderBy: { appliedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      set.status = 404;
      return { error: 'Usuario no encontrado' };
    }

    return { user };
  })
  .patch(
    '/:id',
    async ({ params: { id }, body, set }) => {
      try {
        const data = updateUserSchema.parse(body);
        const { address, ...userData } = data;

        const user = await prisma.user.update({
          where: { id },
          data: {
            ...userData,
            ...(address && {
              address: {
                upsert: {
                  create: address,
                  update: address,
                },
              },
            }),
          },
          include: {
            address: true,
          },
        });

        return {
          message: 'Usuario actualizado exitosamente',
          user,
        };
      } catch (error) {
        set.status = 400;
        return {
          error: error instanceof Error ? error.message : 'Error de validación',
        };
      }
    },
    {
      body: t.Partial(
        t.Object({
          firstName: t.String(),
          lastName: t.String(),
          secondLastName: t.Optional(t.String()),
          dob: t.String(),
          vigencia: t.Optional(t.String()),
          phoneMx: t.String(),
          credencialNum: t.String(),
          gafeteNum: t.String(),
          address: t.Object({
            street: t.String(),
            exteriorNo: t.Optional(t.String()),
            interiorNo: t.Optional(t.String()),
            neighborhood: t.String(),
            city: t.String(),
            municipality: t.String(),
            state: t.String(),
            postalCode: t.String(),
            references: t.Optional(t.String()),
          }),
        })
      ),
    }
  )
  .get('/', async ({ query }) => {
    const { query: searchQuery } = searchUsersSchema.parse(query);

    // Split the search query into individual words
    const searchWords = searchQuery
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    let users: (User & { address: Address | null })[];

    if (searchWords.length === 1) {
      // Single word search - original logic
      users = await prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: searchQuery } },
            { lastName: { contains: searchQuery } },
            { secondLastName: { contains: searchQuery } },
            { phoneMx: { contains: searchQuery } },
            { credencialNum: { contains: searchQuery } },
            { gafeteNum: { contains: searchQuery } },
          ],
        },
        include: {
          address: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    } else {
      // Multiple words search - each word must match at least one name field
      users = await prisma.user.findMany({
        where: {
          AND: searchWords.map((word) => ({
            OR: [
              { firstName: { contains: word } },
              { lastName: { contains: word } },
              { secondLastName: { contains: word } },
            ],
          })),
        },
        include: {
          address: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    }

    return { users };
  })
  .post(
    '/:id/vigency',
    async ({ params: { id }, body, set }) => {
      try {
        const data = applyVigencySchema.parse(body);

        const user = await prisma.user.findUnique({
          where: { id },
        });

        if (!user) {
          set.status = 404;
          return { error: 'Usuario no encontrado' };
        }

        const vigencyEvent = await prisma.vigencyEvent.create({
          data: {
            userId: id,
            note: data.note,
          },
        });

        await prisma.user.update({
          where: { id },
          data: {
            lastVigencyAt: vigencyEvent.appliedAt,
          },
        });

        return {
          message: 'Vigencia aplicada exitosamente',
          vigencyEvent,
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
        note: t.Optional(t.String()),
      }),
    }
  )
  .post(
    '/:id/signature',
    async ({ params: { id }, body, set }) => {
      try {
        const files = body as { file?: File };
        const file = files.file;

        if (!file) {
          set.status = 400;
          return { error: 'No se ha enviado un archivo' };
        }

        if (file.size > 2 * 1024 * 1024) {
          set.status = 400;
          return { error: 'El archivo debe ser menor a 2MB' };
        }

        if (!['image/png', 'image/jpeg'].includes(file.type)) {
          set.status = 400;
          return { error: 'Solo se permiten archivos PNG o JPEG' };
        }

        const user = await prisma.user.findUnique({
          where: { id },
        });

        if (!user) {
          set.status = 404;
          return { error: 'Usuario no encontrado' };
        }

        const signaturesDir = '../../storage/signatures';
        await Bun.write(`${signaturesDir}/.gitkeep`, ''); // Ensure directory exists

        const fileExtension = file.type === 'image/png' ? 'png' : 'jpg';
        const fileName = `${id}-${crypto.randomUUID()}.${fileExtension}`;
        const filePath = `${signaturesDir}/${fileName}`;
        const relativePath = `signatures/${fileName}`;

        await Bun.write(filePath, file);

        await prisma.user.update({
          where: { id },
          data: {
            signaturePath: relativePath,
          },
        });

        return {
          message: 'Firma actualizada exitosamente',
          path: relativePath,
        };
      } catch (error) {
        set.status = 500;
        return {
          error: error instanceof Error ? error.message : 'Error al subir archivo',
        };
      }
    },
    {
      body: t.Object({
        file: t.File(),
      }),
    }
  )
  .get('/:id/signature', async ({ params: { id }, set }) => {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { signaturePath: true },
    });

    if (!user || !user.signaturePath) {
      set.status = 404;
      return { error: 'Firma no encontrada' };
    }

    const filePath = `../../storage/${user.signaturePath}`;

    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      set.status = 404;
      return { error: 'Archivo de firma no encontrado' };
    }

    const fileExtension = user.signaturePath.split('.').pop();
    const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';

    set.headers['Content-Type'] = mimeType;
    set.headers['Content-Length'] = file.size.toString();
    set.headers['Cache-Control'] = 'public, max-age=3600';

    return new Response(file);
  });
