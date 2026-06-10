-- DropForeignKey
ALTER TABLE "repair_tickets" DROP CONSTRAINT "repair_tickets_deviceId_fkey";

-- AddForeignKey
ALTER TABLE "repair_tickets" ADD CONSTRAINT "repair_tickets_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
