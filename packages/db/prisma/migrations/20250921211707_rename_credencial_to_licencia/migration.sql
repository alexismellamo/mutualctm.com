-- RenameColumn: Rename column `credencialNum` to `licenciaNum` in table `users`
-- SQLite does not support renaming columns directly, so we need to recreate the table

-- Create new table with the correct column name
CREATE TABLE "users_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "secondLastName" TEXT,
    "dob" DATETIME NOT NULL,
    "phoneMx" TEXT NOT NULL,
    "licenciaNum" TEXT NOT NULL,
    "gafeteNum" TEXT NOT NULL,
    "photoPath" TEXT,
    "signaturePath" TEXT,
    "lastVigencyAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "vigencia" DATETIME
);

-- Copy data from old table to new table, mapping credencialNum to licenciaNum
INSERT INTO "users_new" 
SELECT 
    "id",
    "firstName", 
    "lastName", 
    "secondLastName", 
    "dob", 
    "phoneMx", 
    "credencialNum" as "licenciaNum", 
    "gafeteNum", 
    "photoPath", 
    "signaturePath", 
    "lastVigencyAt", 
    "createdAt", 
    "updatedAt", 
    "vigencia"
FROM "users";

-- Drop old table
DROP TABLE "users";

-- Rename new table to original name
ALTER TABLE "users_new" RENAME TO "users";

-- Recreate the foreign key constraints for related tables
-- First drop the existing foreign key constraints by recreating the affected tables

-- Recreate addresses table with foreign key
CREATE TABLE "addresses_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "exteriorNo" TEXT,
    "interiorNo" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "references" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Copy data from old addresses table
INSERT INTO "addresses_new" SELECT * FROM "addresses";

-- Drop and rename addresses table
DROP TABLE "addresses";
ALTER TABLE "addresses_new" RENAME TO "addresses";

-- Create unique constraint for userId in addresses
CREATE UNIQUE INDEX "addresses_userId_key" ON "addresses"("userId");

-- Recreate vigency_events table with foreign key
CREATE TABLE "vigency_events_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    CONSTRAINT "vigency_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Copy data from old vigency_events table
INSERT INTO "vigency_events_new" SELECT * FROM "vigency_events";

-- Drop and rename vigency_events table
DROP TABLE "vigency_events";
ALTER TABLE "vigency_events_new" RENAME TO "vigency_events";
