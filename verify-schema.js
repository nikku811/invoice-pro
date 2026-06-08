/**
 * Schema verification script.
 * Checks that all new columns exist in the DB.
 * Run: node verify-schema.js
 */

async function main() {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  console.log("🔍 Verifying schema columns...\n");

  try {
    // Query information_schema to check columns exist
    const invoiceColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'invoices'
        AND column_name IN ('terms', 'dueDate', 'advance')
      ORDER BY column_name;
    `;

    const profileColumns = await prisma.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'business_profiles'
        AND column_name = 'orgLogo';
    `;

    console.log("📋 Invoice table new columns:");
    if (invoiceColumns.length === 0) {
      console.log("  ❌ MISSING — migration has not been applied yet");
    } else {
      invoiceColumns.forEach(col => {
        console.log(`  ✅ ${col.column_name} (${col.data_type})`);
      });
    }

    console.log("\n📋 BusinessProfile table new columns:");
    if (profileColumns.length === 0) {
      console.log("  ❌ orgLogo — MISSING");
    } else {
      console.log(`  ✅ orgLogo (${profileColumns[0].data_type})`);
    }

    const allPresent = invoiceColumns.length === 3 && profileColumns.length === 1;
    console.log(`\n${allPresent ? "✅ All columns verified!" : "❌ Some columns missing — run migration first."}`);
  } catch (err) {
    console.error("❌ Could not connect to database:", err.message);
    console.error("   Make sure the Neon proxy is running at 127.0.0.1:5433");
  } finally {
    await prisma.$disconnect();
  }
}

main();
