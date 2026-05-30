-- CreateTable
CREATE TABLE "annual_inventories" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annual_inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_check_items" (
    "id" SERIAL NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "found" BOOLEAN NOT NULL DEFAULT false,
    "locationFound" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_check_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "annual_inventories_year_sectionId_idx" ON "annual_inventories"("year", "sectionId");

-- CreateIndex
CREATE INDEX "annual_inventories_status_idx" ON "annual_inventories"("status");

-- CreateIndex
CREATE INDEX "inventory_check_items_inventoryId_idx" ON "inventory_check_items"("inventoryId");

-- CreateIndex
CREATE INDEX "inventory_check_items_deviceId_idx" ON "inventory_check_items"("deviceId");

-- CreateIndex
CREATE INDEX "inventory_check_items_status_idx" ON "inventory_check_items"("status");

-- AddForeignKey
ALTER TABLE "annual_inventories" ADD CONSTRAINT "annual_inventories_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_check_items" ADD CONSTRAINT "inventory_check_items_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "annual_inventories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_check_items" ADD CONSTRAINT "inventory_check_items_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
