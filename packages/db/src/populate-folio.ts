import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from './index.js';

async function main() {
  console.log('📝 Populating folio numbers for existing users...');

  // Read and parse CSV file
  const csvPath = join(process.cwd(), '../../olddb.csv');
  console.log(`📄 Reading CSV from: ${csvPath}`);

  let csvContent: string;
  try {
    csvContent = readFileSync(csvPath, 'utf-8');
  } catch (error) {
    console.error('❌ Could not read CSV file:', error);
    throw new Error('CSV file not found. Make sure olddb.csv is in the project root.');
  }

  const lines = csvContent.split('\n').filter((line) => line.trim());
  console.log(`📈 Total lines to process: ${lines.length - 1}`);

  // Create a map of users by licencia number for quick lookup
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      licenciaNum: true,
      folio: true,
    },
  });

  const usersByLicencia = new Map(allUsers.map((user) => [user.licenciaNum, user]));

  console.log(`👥 Found ${allUsers.length} existing users in database`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  // Parse CSV data (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const fields = parseCSVLine(line);
      const [
        folio,
        _nombre,
        _telefono,
        _calle,
        _colonia,
        _cp,
        _municipio,
        _estado,
        _edad,
        licencia,
      ] = fields;

      if (!folio || !licencia) {
        skippedCount++;
        continue;
      }

      // Find user by licencia number
      const user = usersByLicencia.get(licencia);
      if (!user) {
        console.log(`⚠️  User with licencia ${licencia} not found in database`);
        skippedCount++;
        continue;
      }

      // Skip if folio already exists
      if (user.folio) {
        skippedCount++;
        continue;
      }

      // Update user with folio
      await prisma.user.update({
        where: { id: user.id },
        data: { folio: folio.padStart(4, '0') }, // Ensure 4-digit format
      });

      successCount++;
      if (successCount % 50 === 0) {
        console.log(`✅ Updated ${successCount} users with folio numbers...`);
      }
    } catch (error) {
      errorCount++;
      console.log(
        `❌ Error processing line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  console.log(`\n🎉 Folio population completed!`);
  console.log(`✅ Successfully updated: ${successCount} users`);
  console.log(`⏭️  Skipped: ${skippedCount} (already had folio or missing data)`);
  console.log(`❌ Errors: ${errorCount}`);
}

// Helper function to parse CSV line (handles commas in quoted fields)
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Folio population failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
