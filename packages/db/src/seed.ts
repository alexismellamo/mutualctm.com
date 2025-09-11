import { hash } from 'argon2';
import { prisma } from './index.js';

async function main() {
  console.log('🌱 Seeding database...');

  // Get environment variables
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@ctm.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';

  // Create admin user
  const hashedPassword = await hash(adminPassword);

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
    },
  });

  console.log(`✅ Admin created: ${admin.email}`);

  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {
      ajustadorColima: '3121020805',
      ajustadorTecoman: '3131202631',
      ajustadorManzanillo: '3141351075',
    },
    create: {
      ajustadorColima: '3121020805',
      ajustadorTecoman: '3131202631',
      ajustadorManzanillo: '3141351075',
    },
  });

  console.log('✅ Default settings created');

  // Create test users named Alexis
  const testUsers = [
    {
      firstName: 'Alexis',
      lastName: 'Navarro',
      secondLastName: 'Llamas',
      dob: '1995-07-22',
      vigencia: '2025-12-31',
      phoneMx: '3121234567',
      credencialNum: 'CTM001',
      gafeteNum: 'GAF001',
      address: {
        street: 'Av. Principal',
        exteriorNo: '123',
        neighborhood: 'Centro',
        city: 'Colima',
        municipality: 'Colima',
        state: 'Colima',
        postalCode: '28000',
      },
    },
    {
      firstName: 'Alexis',
      lastName: 'García',
      secondLastName: 'López',
      dob: '1988-03-15',
      vigencia: '2024-06-30',
      phoneMx: '3129876543',
      credencialNum: 'CTM002',
      gafeteNum: 'GAF002',
      address: {
        street: 'Calle Revolución',
        exteriorNo: '456',
        neighborhood: 'Revolución',
        city: 'Tecomán',
        municipality: 'Tecomán',
        state: 'Colima',
        postalCode: '28110',
      },
    },
    {
      firstName: 'Alexis',
      lastName: 'Martínez',
      secondLastName: 'Hernández',
      dob: '1992-11-08',
      vigencia: '2026-01-15',
      phoneMx: '3145678901',
      credencialNum: 'CTM003',
      gafeteNum: 'GAF003',
      address: {
        street: 'Blvd. Costero',
        exteriorNo: '789',
        neighborhood: 'Salahua',
        city: 'Manzanillo',
        municipality: 'Manzanillo',
        state: 'Colima',
        postalCode: '28200',
      },
    },
    {
      firstName: 'Alexis',
      lastName: 'Rodríguez',
      secondLastName: 'Sánchez',
      dob: '1985-09-12',
      vigencia: '2023-12-31', // Expired
      phoneMx: '3132345678',
      credencialNum: 'CTM004',
      gafeteNum: 'GAF004',
      address: {
        street: 'Calle Hidalgo',
        exteriorNo: '321',
        neighborhood: 'Centro',
        city: 'Villa de Álvarez',
        municipality: 'Villa de Álvarez',
        state: 'Colima',
        postalCode: '28970',
      },
    },
    {
      firstName: 'Alexis',
      lastName: 'Fernández',
      secondLastName: 'Morales',
      dob: '1990-05-20',
      vigencia: '2025-08-30',
      phoneMx: '3156789012',
      credencialNum: 'CTM005',
      gafeteNum: 'GAF005',
      address: {
        street: 'Av. Universidad',
        exteriorNo: '567',
        neighborhood: 'Universitaria',
        city: 'Colima',
        municipality: 'Colima',
        state: 'Colima',
        postalCode: '28040',
      },
    },
    {
      firstName: 'Alexis',
      lastName: 'Torres',
      secondLastName: 'Jiménez',
      dob: '1987-12-03',
      vigencia: '2024-12-31',
      phoneMx: '3167890123',
      credencialNum: 'CTM006',
      gafeteNum: 'GAF006',
      address: {
        street: 'Calle Morelos',
        exteriorNo: '890',
        neighborhood: 'Morelos',
        city: 'Coquimatlán',
        municipality: 'Coquimatlán',
        state: 'Colima',
        postalCode: '28400',
      },
    },
    {
      firstName: 'Alexis',
      lastName: 'Vargas',
      secondLastName: 'Cruz',
      dob: '1993-02-28',
      vigencia: '2025-03-15',
      phoneMx: '3178901234',
      credencialNum: 'CTM007',
      gafeteNum: 'GAF007',
      address: {
        street: 'Av. Tecnológico',
        exteriorNo: '234',
        neighborhood: 'Tecnológico',
        city: 'Colima',
        municipality: 'Colima',
        state: 'Colima',
        postalCode: '28017',
      },
    },
    {
      firstName: 'Alexis',
      lastName: 'Mendoza',
      secondLastName: 'Ramírez',
      dob: '1991-08-14',
      vigencia: '2026-05-20',
      phoneMx: '3189012345',
      credencialNum: 'CTM008',
      gafeteNum: 'GAF008',
      address: {
        street: 'Calle Juárez',
        exteriorNo: '678',
        neighborhood: 'Juárez',
        city: 'Tecomán',
        municipality: 'Tecomán',
        state: 'Colima',
        postalCode: '28120',
      },
    },
    {
      firstName: 'Alexis',
      lastName: 'Castillo',
      secondLastName: 'Flores',
      dob: '1989-06-07',
      vigencia: '2024-11-30',
      phoneMx: '3190123456',
      credencialNum: 'CTM009',
      gafeteNum: 'GAF009',
      address: {
        street: 'Av. México',
        exteriorNo: '345',
        neighborhood: 'México',
        city: 'Manzanillo',
        municipality: 'Manzanillo',
        state: 'Colima',
        postalCode: '28230',
      },
    },
    {
      firstName: 'Alexis',
      lastName: 'Ruiz',
      secondLastName: 'Guerrero',
      dob: '1994-01-25',
      vigencia: null, // No vigencia
      phoneMx: '3101234567',
      credencialNum: 'CTM010',
      gafeteNum: 'GAF010',
      address: {
        street: 'Calle Independencia',
        exteriorNo: '789',
        neighborhood: 'Independencia',
        city: 'Armería',
        municipality: 'Armería',
        state: 'Colima',
        postalCode: '28300',
      },
    },
  ];

  console.log('🧪 Creating test users...');

  for (const userData of testUsers) {
    const user = await prisma.user.create({
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        secondLastName: userData.secondLastName,
        dob: new Date(userData.dob),
        vigencia: userData.vigencia ? new Date(userData.vigencia) : null,
        phoneMx: userData.phoneMx,
        credencialNum: userData.credencialNum,
        gafeteNum: userData.gafeteNum,
        address: {
          create: userData.address,
        },
      },
      include: {
        address: true,
      },
    });

    console.log(`✅ Created user: ${user.firstName} ${user.lastName} ${user.secondLastName}`);
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
