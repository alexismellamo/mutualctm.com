import { prisma } from '@ctm/db';
import { hash } from 'argon2';

const isPullRequestEnvironment = () => {
  const environment = process.env.RAILWAY_ENVIRONMENT_NAME ?? '';
  return environment.startsWith('pr-') || environment.includes('-pr-');
};

export async function createPreviewAdmin(): Promise<void> {
  if (!isPullRequestEnvironment()) return;

  await prisma.admin.upsert({
    where: { email: 'admin' },
    update: {
      password: await hash('admin123'),
    },
    create: {
      email: 'admin',
      password: await hash('admin123'),
    },
  });

  console.log('Created preview administrator: admin');
}
