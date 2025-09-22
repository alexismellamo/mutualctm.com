import { prisma } from '@ctm/db';

export async function validateSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;

  const sessionRecord = await prisma.session.findUnique({
    where: { token },
    include: { admin: true },
  });

  if (!sessionRecord || sessionRecord.expiresAt < new Date()) {
    if (sessionRecord) {
      await prisma.session.delete({ where: { id: sessionRecord.id } });
    }
    return false;
  }

  return true;
}
