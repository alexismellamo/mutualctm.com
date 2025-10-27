import { prisma } from '@ctm/db';
import {
  applyVigencySchema,
  createUserSchema,
  searchUsersSchema,
  updateUserSchema,
} from '@ctm/schema';
import type { Address, User } from '@prisma/client';
import { Elysia, t } from 'elysia';
import { withAuth } from '../middleware/withAuth';

export const usersRoutes = new Elysia({ prefix: '/users' })
  .guard(withAuth, (app) => app)
  .get('/next-folio', async () => {
    const lastWithFolio = await prisma.user.findFirst({
      where: { folio: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { folio: true },
    });

    const parsed = lastWithFolio?.folio ? parseInt(lastWithFolio.folio, 10) : NaN;
    const base = Number.isNaN(parsed) ? 3301 : Math.max(parsed, 3301);
    const lastFolio = String(base).padStart(4, '0');
    const nextFolio = String(base + 1).padStart(4, '0');

    return { lastFolio, nextFolio };
  })
  .post(
    '/',
    async ({ body, set }) => {
      try {
        const data = createUserSchema.parse(body);
        const { address, ...userData } = data;

        let folioToUse = (data.folio || '').trim();
        if (!folioToUse) {
          const lastWithFolio = await prisma.user.findFirst({
            where: { folio: { not: null } },
            orderBy: { createdAt: 'desc' },
            select: { folio: true },
          });
          const parsed = lastWithFolio?.folio ? parseInt(lastWithFolio.folio, 10) : NaN;
          const base = Number.isNaN(parsed) ? 3301 : Math.max(parsed, 3301);
          folioToUse = String(base + 1).padStart(4, '0');
        } else {
          const parsedManual = parseInt(folioToUse, 10);
          if (!Number.isNaN(parsedManual)) {
            folioToUse = String(parsedManual).padStart(4, '0');
          }
        }

        const user = await prisma.user.create({
          data: {
            ...userData,
            folio: folioToUse,
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
        licenciaNum: t.String(),
        gafeteNum: t.String(),
        folio: t.Optional(t.String()),
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
          licenciaNum: t.String(),
          gafeteNum: t.String(),
          folio: t.Optional(t.String()),
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
  .get('/', async ({ query, cookie: { session }, set }) => {
    if (!session?.value) {
      set.status = 401;
      return { error: 'No autorizado' };
    }

    const sessionRecord = await prisma.session.findUnique({
      where: { token: session.value },
      include: { admin: true },
    });

    if (!sessionRecord || sessionRecord.expiresAt < new Date()) {
      if (sessionRecord) {
        await prisma.session.delete({ where: { id: sessionRecord.id } });
      }
      set.status = 401;
      return { error: 'Sesión expirada' };
    }

    const { query: searchQuery } = searchUsersSchema.parse(query);

    // Convert search to lowercase for case-insensitive matching
    const searchLower = searchQuery.trim().toLowerCase();

    // Split the search query into individual words
    const searchWords = searchLower.split(/\s+/).filter((word) => word.length > 0);

    let users: (User & { address: Address | null })[];

    if (searchWords.length === 1) {
      // Single word search - get all users and filter in memory for case-insensitive search
      const allUsers = await prisma.user.findMany({
        include: {
          address: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const searchTerm = searchWords[0];
      users = allUsers
        .filter(
          (user) =>
            user.firstName.toLowerCase().includes(searchTerm) ||
            user.lastName.toLowerCase().includes(searchTerm) ||
            user.secondLastName?.toLowerCase().includes(searchTerm) ||
            user.phoneMx.includes(searchQuery) ||
            user.licenciaNum.includes(searchQuery) ||
            user.gafeteNum.includes(searchQuery) ||
            user.folio?.includes(searchQuery)
        )
        .slice(0, 20);
    } else {
      // Multiple words search - each word must match at least one name field (case insensitive)
      const allUsers = await prisma.user.findMany({
        include: {
          address: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      users = allUsers
        .filter((user) => {
          return searchWords.every(
            (word) =>
              user.firstName.toLowerCase().includes(word) ||
              user.lastName.toLowerCase().includes(word) ||
              user.secondLastName?.toLowerCase().includes(word)
          );
        })
        .slice(0, 20);
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
    '/:id/photo',
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

        const photosDir = '../../storage/photos';
        await Bun.write(`${photosDir}/.gitkeep`, ''); // Ensure directory exists

        const fileExtension = file.type === 'image/png' ? 'png' : 'jpg';
        const fileName = `${id}-${crypto.randomUUID()}.${fileExtension}`;
        const filePath = `${photosDir}/${fileName}`;
        const relativePath = `photos/${fileName}`;

        await Bun.write(filePath, file);

        await prisma.user.update({
          where: { id },
          data: {
            photoPath: relativePath,
          },
        });

        return {
          message: 'Foto actualizada exitosamente',
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
  .get('/:id/photo', async ({ params: { id }, set }) => {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { photoPath: true },
    });

    if (!user || !user.photoPath) {
      set.status = 404;
      return { error: 'Foto no encontrada' };
    }

    const filePath = `../../storage/${user.photoPath}`;

    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      set.status = 404;
      return { error: 'Archivo de foto no encontrado' };
    }

    const fileExtension = user.photoPath.split('.').pop();
    const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';

    set.headers['Content-Type'] = mimeType;
    set.headers['Content-Length'] = file.size.toString();
    set.headers['Cache-Control'] = 'public, max-age=3600';

    return new Response(file);
  })
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
