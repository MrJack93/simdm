-- Add verification fields to devices table
ALTER TABLE "devices" ADD COLUMN "requiresVerification" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "verificationType" TEXT,
ADD COLUMN "verificationFreqMonths" INTEGER,
ADD COLUMN "lastVerificationAt" TIMESTAMP(3),
ADD COLUMN "nextVerificationAt" TIMESTAMP(3);

-- CreateTable maintenance_plans
CREATE TABLE "maintenance_plans" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "frequency" TEXT NOT NULL,
    "responsibleName" TEXT NOT NULL,
    "responsibleAffil" TEXT,
    "months" INTEGER[],
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable mpp_occurrences
CREATE TABLE "mpp_occurrences" (
    "id" SERIAL NOT NULL,
    "planId" INTEGER NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROGRAMAT',
    "rescheduledTo" TIMESTAMP(3),
    "rescheduleReason" TEXT,
    "executionId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mpp_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable mpp_executions
CREATE TABLE "mpp_executions" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "occurrenceId" INTEGER,
    "executedDate" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER,
    "checklist" JSONB NOT NULL,
    "consumablesUsed" JSONB,
    "result" TEXT NOT NULL,
    "engineerName" TEXT NOT NULL,
    "signature" TEXT,
    "notes" TEXT,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mpp_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable repair_tickets
CREATE TABLE "repair_tickets" (
    "id" SERIAL NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "sectionId" INTEGER,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedBy" TEXT NOT NULL,
    "faultDescription" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'DESCHIS',
    "faultCause" TEXT,
    "actionsTaken" TEXT,
    "partsUsed" JSONB,
    "totalCost" DECIMAL(10,2),
    "resolvedAt" TIMESTAMP(3),
    "engineerName" TEXT,
    "externalized" BOOLEAN NOT NULL DEFAULT false,
    "createdById" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repair_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable verifications
CREATE TABLE "verifications" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "result" TEXT NOT NULL,
    "certificateNo" TEXT,
    "inspectionBody" TEXT,
    "reportUrl" TEXT,
    "notes" TEXT,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable service_providers
CREATE TABLE "service_providers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "ratingAvg" DECIMAL(3,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable service_contracts
CREATE TABLE "service_contracts" (
    "id" SERIAL NOT NULL,
    "providerId" INTEGER NOT NULL,
    "contractNo" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'MDL',
    "slaHours" INTEGER,
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable provider_ratings
CREATE TABLE "provider_ratings" (
    "id" SERIAL NOT NULL,
    "providerId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex maintenance_plans
CREATE UNIQUE INDEX "maintenance_plans_deviceId_year_key" ON "maintenance_plans"("deviceId", "year");
CREATE INDEX "maintenance_plans_year_idx" ON "maintenance_plans"("year");

-- CreateIndex mpp_occurrences
CREATE INDEX "mpp_occurrences_deviceId_idx" ON "mpp_occurrences"("deviceId");
CREATE INDEX "mpp_occurrences_status_idx" ON "mpp_occurrences"("status");
CREATE INDEX "mpp_occurrences_scheduledDate_idx" ON "mpp_occurrences"("scheduledDate");

-- CreateIndex mpp_executions
CREATE INDEX "mpp_executions_deviceId_idx" ON "mpp_executions"("deviceId");
CREATE INDEX "mpp_executions_executedDate_idx" ON "mpp_executions"("executedDate");

-- CreateIndex repair_tickets
CREATE UNIQUE INDEX "repair_tickets_ticketNumber_key" ON "repair_tickets"("ticketNumber");
CREATE INDEX "repair_tickets_status_idx" ON "repair_tickets"("status");
CREATE INDEX "repair_tickets_deviceId_idx" ON "repair_tickets"("deviceId");

-- CreateIndex verifications
CREATE INDEX "verifications_deviceId_idx" ON "verifications"("deviceId");
CREATE INDEX "verifications_validUntil_idx" ON "verifications"("validUntil");
CREATE INDEX "verifications_result_idx" ON "verifications"("result");

-- CreateIndex service_contracts
CREATE INDEX "service_contracts_endDate_idx" ON "service_contracts"("endDate");

-- AddForeignKey maintenance_plans
ALTER TABLE "maintenance_plans" ADD CONSTRAINT "maintenance_plans_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey mpp_occurrences
ALTER TABLE "mpp_occurrences" ADD CONSTRAINT "mpp_occurrences_planId_fkey" FOREIGN KEY ("planId") REFERENCES "maintenance_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey mpp_executions
ALTER TABLE "mpp_executions" ADD CONSTRAINT "mpp_executions_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mpp_executions" ADD CONSTRAINT "mpp_executions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey repair_tickets
ALTER TABLE "repair_tickets" ADD CONSTRAINT "repair_tickets_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "repair_tickets" ADD CONSTRAINT "repair_tickets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey verifications
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey service_contracts
ALTER TABLE "service_contracts" ADD CONSTRAINT "service_contracts_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "service_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey provider_ratings
ALTER TABLE "provider_ratings" ADD CONSTRAINT "provider_ratings_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "service_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
