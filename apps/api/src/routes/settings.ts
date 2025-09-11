import { prisma } from '@ctm/db';
import { updateSettingsSchema } from '@ctm/schema';
import { Elysia, t } from 'elysia';
import { authMiddleware } from '../middleware/auth';

export const settingsRoutes = new Elysia({ prefix: '/settings' })
  .use(authMiddleware)
  .get('/', async () => {
    const settings = await prisma.settings.findFirst();

    if (!settings) {
      const defaultSettings = await prisma.settings.create({
        data: {
          ajustadorColima: '',
          ajustadorTecoman: '',
          ajustadorManzanillo: '',
        },
      });
      return { settings: defaultSettings };
    }

    return { settings };
  })
  .put(
    '/',
    async ({ body, set }) => {
      try {
        const data = updateSettingsSchema.parse(body);

        const settings = await prisma.settings.upsert({
          where: { id: 1 },
          update: data,
          create: {
            ...data,
          },
        });

        return {
          message: 'Configuración actualizada',
          settings,
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
        ajustadorColima: t.String(),
        ajustadorTecoman: t.String(),
        ajustadorManzanillo: t.String(),
      }),
    }
  )
  .post(
    '/presidente-firma',
    async ({ body, set }) => {
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

        const assetsDir = '../../storage/assets';
        await Bun.write(`${assetsDir}/.gitkeep`, ''); // Ensure directory exists

        const fileName = `presidente-firma.${file.type === 'image/png' ? 'png' : 'jpg'}`;
        const filePath = `${assetsDir}/${fileName}`;
        const relativePath = `assets/${fileName}`;

        await Bun.write(filePath, file);

        await prisma.settings.upsert({
          where: { id: 1 },
          update: { presidenteFirmaPath: relativePath },
          create: {
            ajustadorColima: '',
            ajustadorTecoman: '',
            ajustadorManzanillo: '',
            presidenteFirmaPath: relativePath,
          },
        });

        return {
          message: 'Firma del presidente actualizada',
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
  );
