import { prisma } from '@ctm/db';
import { hash } from 'argon2';

const isPullRequestEnvironment = () => {
  const environment = process.env.RAILWAY_ENVIRONMENT_NAME ?? '';
  return environment.startsWith('pr-') || environment.includes('-pr-');
};

async function seedPreviewUsers(): Promise<void> {
  if ((await prisma.user.count()) > 0) return;

  const firstNames = [
    'Alejandra',
    'Carlos',
    'Daniela',
    'Ernesto',
    'Fernanda',
    'Gabriel',
    'Isabel',
    'Javier',
    'Karla',
    'Luis',
  ];
  const lastNames = [
    'García',
    'Hernández',
    'López',
    'Martínez',
    'Pérez',
    'Ramírez',
    'Sánchez',
    'Torres',
    'Vargas',
    'Zamora',
  ];
  const today = new Date();

  await prisma.$transaction(
    Array.from({ length: 100 }, (_, index) => {
      const number = index + 1;
      const vigencia = new Date(today);
      const cycle = index % 3;
      vigencia.setDate(today.getDate() + (cycle === 0 ? 180 : cycle === 1 ? 15 : -15));

      return prisma.user.create({
        data: {
          firstName: firstNames[index % firstNames.length],
          lastName: lastNames[index % lastNames.length],
          secondLastName: lastNames[(index + 3) % lastNames.length],
          dob: new Date(1970 + (index % 30), index % 12, (index % 27) + 1),
          vigencia,
          phoneMx: `312555${String(number).padStart(4, '0')}`,
          licenciaNum: `LIC-${String(number).padStart(5, '0')}`,
          gafeteNum: `GAF-${String(number).padStart(4, '0')}`,
          folio: String(3301 + number).padStart(4, '0'),
          address: {
            create: {
              street: `Calle de Prueba ${number}`,
              exteriorNo: String(number),
              neighborhood: 'Centro',
              city: 'Colima',
              municipality: 'Colima',
              state: 'Colima',
              postalCode: '28000',
            },
          },
        },
      });
    })
  );

  console.log('Seeded 100 sample users for the pull request preview');
}

export async function createPreviewAdmin(): Promise<void> {
  if (!isPullRequestEnvironment()) return;

  await prisma.admin.upsert({
    where: { email: 'admin@ctm.local' },
    update: {
      password: await hash('admin123'),
    },
    create: {
      email: 'admin@ctm.local',
      password: await hash('admin123'),
    },
  });

  await seedPreviewUsers();
  console.log('Created preview administrator: admin@ctm.local');
}
