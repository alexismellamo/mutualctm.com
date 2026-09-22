import { prisma } from '@ctm/db';
import { hash } from 'argon2';

const isPullRequestEnvironment = () => {
  const environment = process.env.RAILWAY_ENVIRONMENT_NAME ?? '';
  return environment.startsWith('pr-') || environment.includes('-pr-');
};

export async function createPreviewAdmin(): Promise<void> {
  if (!isPullRequestEnvironment()) return;

  const adminCount = await prisma.admin.count();
  if (adminCount > 0) return;

  await prisma.admin.create({
    data: {
      email: 'preview@mutualctm.local',
      password: await hash('preview123'),
    },
  });

  console.log('Created preview administrator: preview@mutualctm.local');
}
