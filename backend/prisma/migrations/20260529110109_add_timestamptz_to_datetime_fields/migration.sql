-- Convert all DateTime fields to TIMESTAMPTZ(3) for timezone awareness

-- users table
ALTER TABLE "users" ALTER COLUMN "lastLoginAt" TYPE TIMESTAMPTZ(3);
ALTER TABLE "users" ALTER COLUMN "lockedUntil" TYPE TIMESTAMPTZ(3);
ALTER TABLE "users" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3);
ALTER TABLE "users" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3);

-- refresh_tokens table
ALTER TABLE "refresh_tokens" ALTER COLUMN "expiresAt" TYPE TIMESTAMPTZ(3);
ALTER TABLE "refresh_tokens" ALTER COLUMN "revokedAt" TYPE TIMESTAMPTZ(3);
ALTER TABLE "refresh_tokens" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3);

-- sections table
ALTER TABLE "sections" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3);
ALTER TABLE "sections" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3);

-- devices table
ALTER TABLE "devices" ALTER COLUMN "acquisitionDate" TYPE TIMESTAMPTZ(3);
ALTER TABLE "devices" ALTER COLUMN "warrantyEndDate" TYPE TIMESTAMPTZ(3);
ALTER TABLE "devices" ALTER COLUMN "decommissionDate" TYPE TIMESTAMPTZ(3);
ALTER TABLE "devices" ALTER COLUMN "nextMaintenanceAt" TYPE TIMESTAMPTZ(3);
ALTER TABLE "devices" ALTER COLUMN "lastMaintenanceAt" TYPE TIMESTAMPTZ(3);
ALTER TABLE "devices" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3);
ALTER TABLE "devices" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3);

-- consumables table
ALTER TABLE "consumables" ALTER COLUMN "expiryDate" TYPE TIMESTAMPTZ(3);
ALTER TABLE "consumables" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3);
ALTER TABLE "consumables" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3);

-- device_consumables table
ALTER TABLE "device_consumables" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3);

-- maintenance_records table
ALTER TABLE "maintenance_records" ALTER COLUMN "scheduledDate" TYPE TIMESTAMPTZ(3);
ALTER TABLE "maintenance_records" ALTER COLUMN "executedDate" TYPE TIMESTAMPTZ(3);
ALTER TABLE "maintenance_records" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3);
ALTER TABLE "maintenance_records" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3);

-- incidents table
ALTER TABLE "incidents" ALTER COLUMN "occurredAt" TYPE TIMESTAMPTZ(3);
ALTER TABLE "incidents" ALTER COLUMN "reportedAt" TYPE TIMESTAMPTZ(3);
ALTER TABLE "incidents" ALTER COLUMN "resolvedAt" TYPE TIMESTAMPTZ(3);
ALTER TABLE "incidents" ALTER COLUMN "amdmReportDate" TYPE TIMESTAMPTZ(3);
ALTER TABLE "incidents" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3);
ALTER TABLE "incidents" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3);

-- documents table
ALTER TABLE "documents" ALTER COLUMN "uploadedAt" TYPE TIMESTAMPTZ(3);
ALTER TABLE "documents" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3);

-- audit_logs table
ALTER TABLE "audit_logs" ALTER COLUMN "timestamp" TYPE TIMESTAMPTZ(3);
