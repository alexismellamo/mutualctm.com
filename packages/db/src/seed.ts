import { hash } from 'argon2';
import { readFileSync } from 'fs';
import { join } from 'path';
import { prisma } from './index.js';

async function main() {
  console.log('🌱 Seeding database...');

  // Check if database is already seeded
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('❌ Database already has users. Aborting seed to prevent duplicates.');
    console.log(`Found ${existingUsers} existing users.`);
    throw new Error('Database already seeded. Please clear the database before running seed again.');
  }

  // Create admin user with new credentials
  const adminEmail = 'admin@mutualctm.com';
  const adminPassword = 'mutualctm123';
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

  // Create settings
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

  console.log(`✅ Settings created/updated`);

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

  const lines = csvContent.split('\n').filter(line => line.trim());
  const header = lines[0];
  console.log(`📊 CSV Header: ${header}`);
  console.log(`📈 Total lines to process: ${lines.length - 1}`);

  // Parse CSV data (skip header)
  let successCount = 0;
  let errorCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const fields = parseCSVLine(line);
      if (fields.length < 12) {
        console.log(`⚠️  Skipping line ${i + 1}: insufficient fields`);
        continue;
      }

      const [folio, nombre, telefono, calle, colonia, cp, municipio, estado, edad, licencia, vigencia, gafete] = fields;

      // Skip if essential fields are missing
      if (!nombre || !telefono || !licencia || !gafete) {
        console.log(`⚠️  Skipping line ${i + 1}: missing essential data (${nombre || 'NO_NAME'})`);
        continue;
      }

      // Parse name into components
      const nameParts = nombre.split(' ').filter(part => part.trim());
      if (nameParts.length < 2) {
        console.log(`⚠️  Skipping line ${i + 1}: invalid name format (${nombre})`);
        continue;
      }

      const firstName = nameParts[0];
      const lastName = nameParts[1];
      const secondLastName = nameParts.length > 2 ? nameParts.slice(2).join(' ') : undefined;

      // Parse dates
      const dobDate = calculateDOBFromAge(edad);
      const vigenciaDate = parseVigenciaDate(vigencia);

      // Validate phone number (should be 10 digits)
      const cleanPhone = telefono.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        console.log(`⚠️  Skipping line ${i + 1}: invalid phone number (${telefono})`);
        continue;
      }

      // Create user record
      const userData = {
        firstName,
        lastName,
        secondLastName,
        dob: dobDate,
        vigencia: vigenciaDate,
        phoneMx: cleanPhone,
        licenciaNum: licencia,
        gafeteNum: gafete,
      };

      // Create address if we have enough data
      let addressData = null;
      if (calle && colonia) {
        addressData = {
          street: calle,
          neighborhood: colonia,
          city: municipio || 'COLIMA',
          municipality: municipio || 'COLIMA',
          state: estado || 'COLIMA',
          postalCode: cp || '28000',
        };
      }

      const user = await prisma.user.create({
        data: {
          ...userData,
          ...(addressData && {
            address: {
              create: addressData,
            },
          }),
        },
        include: {
          address: true,
        },
      });

      successCount++;
      if (successCount % 100 === 0) {
        console.log(`✅ Processed ${successCount} users...`);
      }

    } catch (error) {
      errorCount++;
      console.log(`❌ Error processing line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log(`\n🎉 Seeding completed!`);
  console.log(`✅ Successfully created: ${successCount} users`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total processed: ${successCount + errorCount}`);
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

// Helper function to calculate DOB from age
function calculateDOBFromAge(edadStr: string): Date {
  const edad = parseInt(edadStr) || 30; // Default age if invalid
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - edad;
  return new Date(birthYear, 0, 1); // January 1st of birth year
}

// Helper function to parse vigencia date
function parseVigenciaDate(vigenciaStr: string): Date | null {
  if (!vigenciaStr) return null;
  
  // Handle different date formats from CSV
  // Examples: "21/08/2018", "25/05/26", "09/05/2025"
  const cleanVigencia = vigenciaStr.replace(/\s+/g, '');
  
  // Try different date formats
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // dd/mm/yyyy
    /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/,  // dd/mm/yy
  ];
  
  for (const format of formats) {
    const match = cleanVigencia.match(format);
    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]) - 1; // Month is 0-indexed
      let year = parseInt(match[3]);
      
      // Handle 2-digit years
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
      
      return new Date(year, month, day);
    }
  }
  
  console.log(`⚠️  Could not parse vigencia date: ${vigenciaStr}`);
  return null;
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });