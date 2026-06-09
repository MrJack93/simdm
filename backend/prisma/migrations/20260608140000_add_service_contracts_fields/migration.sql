-- AddColumn: service_contracts — Add coveredDeviceIds array
ALTER TABLE "service_contracts" ADD COLUMN "coveredDeviceIds" INTEGER[];

-- AddConstraint: contractNo must be unique
ALTER TABLE "service_contracts" ADD CONSTRAINT "service_contracts_contractNo_key" UNIQUE("contractNo");

-- AddIndex: providerId for faster lookups
CREATE INDEX "service_contracts_providerId_idx" ON "service_contracts"("providerId");

-- Backfill defaults for existing rows (if any)
UPDATE "service_contracts" SET "coveredDeviceIds" = ARRAY[]::INTEGER[] WHERE "coveredDeviceIds" IS NULL;
