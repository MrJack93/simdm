-- AlterEnum
ALTER TYPE "DeviceStatus" ADD VALUE 'CONSERVAT';

-- AlterTable
ALTER TABLE "repair_tickets" ADD COLUMN     "faultCategory" TEXT;

-- CreateTable
CREATE TABLE "decommission_records" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "nonUsageDate" TIMESTAMP(3),
    "normativeLifespan" TEXT,
    "commissioningDate" TIMESTAMP(3),
    "nominalPrice" DECIMAL(65,30),
    "currentValue" DECIMAL(65,30),
    "technicalState" TEXT,
    "cause" TEXT,
    "notes" TEXT,
    "responsibleName" TEXT,
    "sectionChief" TEXT,
    "engineerName" TEXT,
    "sibmChief" TEXT,
    "recyclingInfo" TEXT,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decommission_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duty_log_entries" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER,
    "deviceName" TEXT NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "faultDescription" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "engineerName" TEXT,
    "repairTicketId" INTEGER,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duty_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "decommission_records_deviceId_idx" ON "decommission_records"("deviceId");

-- CreateIndex
CREATE INDEX "decommission_records_type_idx" ON "decommission_records"("type");

-- CreateIndex
CREATE INDEX "duty_log_entries_deviceId_idx" ON "duty_log_entries"("deviceId");

-- CreateIndex
CREATE INDEX "duty_log_entries_reportedAt_idx" ON "duty_log_entries"("reportedAt");

-- AddForeignKey
ALTER TABLE "decommission_records" ADD CONSTRAINT "decommission_records_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decommission_records" ADD CONSTRAINT "decommission_records_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duty_log_entries" ADD CONSTRAINT "duty_log_entries_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duty_log_entries" ADD CONSTRAINT "duty_log_entries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
