-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "deviceId" INTEGER,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "uploadedById" INTEGER;

-- CreateIndex
CREATE INDEX "documents_isCurrent_idx" ON "documents"("isCurrent");

-- CreateIndex
CREATE INDEX "documents_isDeleted_idx" ON "documents"("isDeleted");

-- CreateIndex
CREATE INDEX "documents_deviceId_idx" ON "documents"("deviceId");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
