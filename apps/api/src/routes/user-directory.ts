import { prisma } from '@ctm/db';
import { Elysia } from 'elysia';
import { withAuth } from '../middleware/withAuth';
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
      .get('/export', async () => {
        const users = await prisma.user.findMany({
          include: { address: true },
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
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
            date(user.createdAt),
            date(user.updatedAt),
          ])
        );
        const filenameDate = new Date().toISOString().slice(0, 10);

        return new Response(`\uFEFF${[csvRow(headers), ...rows].join('\n')}`, {
          headers: {
            'Content-Disposition': `attachment; filename="respaldo-usuarios-${filenameDate}.csv"`,
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
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        }),
      }))
);
