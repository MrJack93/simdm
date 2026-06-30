-- CreateTable
CREATE TABLE "procurement_plans" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "sectionId" INTEGER,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "elaboratedBy" TEXT,
    "coordSection" TEXT,
    "coordSibm" TEXT,
    "approvedAt" TIMESTAMP(3),
    "totalAmount" DECIMAL(65,30),
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_items" (
    "id" SERIAL NOT NULL,
    "planId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "specification" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT,
    "funding" TEXT,
    "unitPrice" DECIMAL(65,30),
    "totalPrice" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "procurement_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissioning_records" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "installDate" TIMESTAMP(3),
    "warrantyMonths" INTEGER,
    "contractNo" TEXT,
    "contractDate" TIMESTAMP(3),
    "conformityOk" BOOLEAN NOT NULL DEFAULT false,
    "operationTestOk" BOOLEAN NOT NULL DEFAULT false,
    "operationManual" BOOLEAN NOT NULL DEFAULT false,
    "serviceManual" BOOLEAN NOT NULL DEFAULT false,
    "trainingDone" BOOLEAN NOT NULL DEFAULT false,
    "trainees" JSONB,
    "commissionMembers" TEXT,
    "commissionDecision" TEXT,
    "comments" TEXT,
    "handoverActNo" TEXT,
    "supplier" TEXT,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commissioning_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "procurement_plans_year_idx" ON "procurement_plans"("year");

-- CreateIndex
CREATE INDEX "procurement_plans_type_idx" ON "procurement_plans"("type");

-- CreateIndex
CREATE INDEX "procurement_plans_status_idx" ON "procurement_plans"("status");

-- CreateIndex
CREATE INDEX "procurement_items_planId_idx" ON "procurement_items"("planId");

-- CreateIndex
CREATE INDEX "commissioning_records_deviceId_idx" ON "commissioning_records"("deviceId");

-- AddForeignKey
ALTER TABLE "procurement_plans" ADD CONSTRAINT "procurement_plans_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_plans" ADD CONSTRAINT "procurement_plans_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_items" ADD CONSTRAINT "procurement_items_planId_fkey" FOREIGN KEY ("planId") REFERENCES "procurement_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissioning_records" ADD CONSTRAINT "commissioning_records_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissioning_records" ADD CONSTRAINT "commissioning_records_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
