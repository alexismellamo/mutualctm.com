import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { prisma } from '@ctm/db';

type ArchiveFiles = Record<string, Blob | string>;
type ArchiveConstructor = new (
  files: ArchiveFiles,
  options?: { compress?: 'gzip' }
) => { blob: () => Promise<Blob> };

const timestamp = () =>
  new Date().toISOString().replace('T', '_').replace(/[:.]/g, '-').replace('Z', 'UTC');

const databasePath = () => {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith('file:')) throw new Error('DATABASE_URL debe apuntar a un archivo SQLite');

  return resolve(decodeURIComponent(url.slice('file:'.length)));
};

async function addDirectory(
  files: ArchiveFiles,
  source: string,
  destination: string
): Promise<void> {
  try {
    const entries = await readdir(source, { withFileTypes: true });
    for (const entry of entries) {
      const sourcePath = join(source, entry.name);
      const destinationPath = `${destination}/${entry.name}`;
      if (entry.isDirectory()) {
        await addDirectory(files, sourcePath, destinationPath);
      } else if (entry.isFile()) {
        files[destinationPath] = Bun.file(sourcePath);
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

export async function createFullBackup() {
  const backupTime = timestamp();
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'ctmmutual-backup-'));
  const snapshotPath = join(temporaryDirectory, 'ctmmutual.sqlite');

  try {
    // SQLite creates a consistent, standalone snapshot even while the app is in use.
    await prisma.$executeRawUnsafe(`VACUUM INTO '${snapshotPath.replaceAll("'", "''")}'`);

    const files: ArchiveFiles = {
      'README.txt': [
        'CTM Mutual - respaldo completo',
        `Creado: ${new Date().toISOString()}`,
        '',
        'Contenido:',
        '- database/ctmmutual.sqlite: base de datos SQLite restaurable.',
        '- storage/photos: fotos de usuarios.',
        '- storage/signatures: firmas de usuarios.',
        '- storage/assets: firma y recursos institucionales.',
        '',
        'Para restaurar:',
        '1. Detenga la API.',
        '2. Copie database/ctmmutual.sqlite como storage/dev.db.',
        '3. Copie storage/photos, storage/signatures y storage/assets al mismo volumen.',
        '4. Inicie la API.',
      ].join('\n'),
      'manifest.json': JSON.stringify(
        {
          application: 'CTM Mutual Usuarios',
          createdAt: new Date().toISOString(),
          database: 'database/ctmmutual.sqlite',
        },
        null,
        2
      ),
      'database/ctmmutual.sqlite': Bun.file(snapshotPath),
    };

    const storageRoot = resolve(databasePath(), '..');
    await addDirectory(files, join(storageRoot, 'photos'), 'storage/photos');
    await addDirectory(files, join(storageRoot, 'signatures'), 'storage/signatures');
    await addDirectory(files, join(storageRoot, 'assets'), 'storage/assets');

    const Archive = (Bun as unknown as { Archive?: ArchiveConstructor }).Archive;
    if (!Archive) throw new Error('La versión de Bun no admite crear respaldos comprimidos');

    const archive = new Archive(files, { compress: 'gzip' });
    return {
      filename: `ctmmutual-respaldo-completo-${backupTime}.tar.gz`,
      blob: await archive.blob(),
    };
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}
