-- AddColumn: repair_tickets — Add missing fields for photo, signatures, and repair details
ALTER TABLE "repair_tickets" ADD COLUMN "repairReport" TEXT;
ALTER TABLE "repair_tickets" ADD COLUMN "durationHours" DECIMAL(5, 2);
ALTER TABLE "repair_tickets" ADD COLUMN "functionalTest" VARCHAR(20);
ALTER TABLE "repair_tickets" ADD COLUMN "beforePhoto" TEXT;
ALTER TABLE "repair_tickets" ADD COLUMN "afterPhoto" TEXT;
ALTER TABLE "repair_tickets" ADD COLUMN "engineerSignature" TEXT;
ALTER TABLE "repair_tickets" ADD COLUMN "managerSignature" TEXT;

-- Add index for priority filtering
CREATE INDEX "repair_tickets_priority_idx" ON "repair_tickets"("priority");

-- Set defaults for existing rows (if any)
UPDATE "repair_tickets" SET "functionalTest" = 'FUNCTIONAL' WHERE "functionalTest" IS NULL AND "status" IN ('REZOLVAT', 'TESTAT', 'INCHIS');
