-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "destination" TEXT,
ADD COLUMN     "electricalSafetyClass" TEXT,
ADD COLUMN     "financingSource" TEXT,
ADD COLUMN     "installationDate" TIMESTAMP(3);
