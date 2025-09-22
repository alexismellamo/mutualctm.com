import { prisma } from '@ctm/db';

export async function requireAuth(sessionCookie: string | undefined) {
  if (!sessionCookie) {
    throw new Error('No autorizado');
  }

  const sessionRecord = await prisma.session.findUnique({
    where: { token: sessionCookie },
    include: { admin: true },
  });

  if (!sessionRecord || sessionRecord.expiresAt < new Date()) {
    if (sessionRecord) {
      await prisma.session.delete({
        where: { id: sessionRecord.id },
      });
    }
    throw new Error('Sesión expirada');
  }

  return {
    adminId: sessionRecord.adminId,
  };
}
