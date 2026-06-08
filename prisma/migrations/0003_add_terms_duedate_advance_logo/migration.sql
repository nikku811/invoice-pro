-- Add terms, dueDate, advance to invoices table
ALTER TABLE "invoices"
  ADD COLUMN "terms"   TEXT,
  ADD COLUMN "dueDate" TIMESTAMP(3),
  ADD COLUMN "advance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Add orgLogo (base64 data URL) to business_profiles table
ALTER TABLE "business_profiles"
  ADD COLUMN "orgLogo" TEXT;
