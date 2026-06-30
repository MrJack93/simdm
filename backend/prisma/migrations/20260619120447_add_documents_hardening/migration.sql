-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "fileHash" TEXT,
ADD COLUMN     "issuer" TEXT,
ADD COLUMN     "reviewAt" TIMESTAMP(3),
ADD COLUMN     "validFrom" TIMESTAMP(3),
ADD COLUMN     "validUntil" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "documents_validUntil_idx" ON "documents"("validUntil");

-- CreateIndex
CREATE INDEX "documents_fileHash_idx" ON "documents"("fileHash");
