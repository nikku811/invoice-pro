-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID');

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "business_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "orgAddress" TEXT,
    "orgPhone" TEXT,
    "orgEmail" TEXT,
    "orgWebsite" TEXT,
    "orgGstin" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE UNIQUE INDEX "business_profiles_userId_key" ON "business_profiles"("userId");

-- AddForeignKey
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
