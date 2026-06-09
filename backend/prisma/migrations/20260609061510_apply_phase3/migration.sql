-- AlterTable
ALTER TABLE "repair_tickets" ALTER COLUMN "totalCost" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "durationHours" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "functionalTest" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "service_contracts" ALTER COLUMN "value" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "service_providers" ALTER COLUMN "ratingAvg" SET DATA TYPE DECIMAL(65,30);
