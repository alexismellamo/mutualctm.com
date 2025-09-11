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

  // Create default settings
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      ajustadorColima: '12345',
      ajustadorTecoman: '67890',
      ajustadorManzanillo: '54321',
    },
  });

  console.log('✅ Default settings created');

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
