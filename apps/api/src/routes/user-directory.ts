import { prisma } from '@ctm/db';
import { Elysia } from 'elysia';
import { withAuth } from '../middleware/withAuth';
import { createFullBackup } from '../utils/backup';
import { csvRow } from '../utils/csv';

type ExportUser = {
  folio: string | null;
  firstName: string;
  lastName: string;
  secondLastName: string | null;
  dob: Date;
  vigencia: Date | null;
  phoneMx: string;
  licenciaNum: string;
  gafeteNum: string;
  photoPath: string | null;
  signaturePath: string | null;
  createdAt: Date;
  updatedAt: Date;
  address: {
    street: string;
    exteriorNo: string | null;
    interiorNo: string | null;
    neighborhood: string;
    city: string;
    municipality: string;
    state: string;
    postalCode: string;
    references: string | null;
  } | null;
};

export const userDirectoryRoutes = new Elysia({ prefix: '/user-directory' }).guard(
  withAuth,
  (app) =>
    app
      .get('/backup', async ({ set }) => {
        try {
          const { blob, filename } = await createFullBackup();
          return new Response(blob, {
            headers: {
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Content-Type': 'application/gzip',
            },
          });
        } catch (error) {
          set.status = 500;
          return { error: error instanceof Error ? error.message : 'No se pudo crear el respaldo' };
        }
      })
      .get('/export', async () => {
        const users = await prisma.user.findMany({
          include: { address: true },
          orderBy: [{ lastName: 'asc' }, { secondLastName: 'asc' }, { firstName: 'asc' }],
        });
        const headers = [
          'Folio',
          'Nombre',
          'Apellido paterno',
          'Apellido materno',
          'Fecha de nacimiento',
          'Vigencia',
          'Teléfono',
          'Licencia',
          'Gafete',
          'Calle',
          'Número exterior',
          'Número interior',
          'Colonia',
          'Ciudad',
          'Municipio',
          'Estado',
          'Código postal',
          'Referencias',
          'Foto',
          'Firma',
          'Creado el',
          'Actualizado el',
        ];
        const date = (value: Date | null) => value?.toISOString().slice(0, 10) ?? '';
        const rows = (users as ExportUser[]).map((user) =>
          csvRow([
            user.folio,
            user.firstName,
            user.lastName,
            user.secondLastName,
            date(user.dob),
            date(user.vigencia),
            user.phoneMx,
            user.licenciaNum,
            user.gafeteNum,
            user.address?.street,
            user.address?.exteriorNo,
            user.address?.interiorNo,
            user.address?.neighborhood,
            user.address?.city,
            user.address?.municipality,
            user.address?.state,
            user.address?.postalCode,
            user.address?.references,
            user.photoPath,
            user.signaturePath,
            date(user.createdAt),
            date(user.updatedAt),
          ])
        );
        const filenameTimestamp = new Date()
          .toISOString()
          .replace('T', '_')
          .replace(/[:.]/g, '-')
          .replace('Z', 'UTC');

        return new Response(`\uFEFF${[csvRow(headers), ...rows].join('\n')}`, {
          headers: {
            'Content-Disposition': `attachment; filename="ctmmutual-usuarios-${filenameTimestamp}.csv"`,
            'Content-Type': 'text/csv; charset=utf-8',
          },
        });
      })
      .get('/', async () => ({
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
          orderBy: [{ lastName: 'asc' }, { secondLastName: 'asc' }, { firstName: 'asc' }],
        }),
      }))
);
