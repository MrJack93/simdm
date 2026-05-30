-- CreateIndex
CREATE INDEX "audit_logs_entity_timestamp_idx" ON "audit_logs"("entity", "timestamp");

-- CreateIndex
CREATE INDEX "devices_status_sectionId_idx" ON "devices"("status", "sectionId");

-- CreateIndex
CREATE INDEX "devices_name_idx" ON "devices"("name");
