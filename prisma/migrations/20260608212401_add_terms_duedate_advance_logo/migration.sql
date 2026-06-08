/*
  Warnings:

  - You are about to drop the column `orgLogo` on the `business_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `advance` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `terms` on the `invoices` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "business_profiles" DROP COLUMN "orgLogo";

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "advance",
DROP COLUMN "dueDate",
DROP COLUMN "terms";
