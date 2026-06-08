/**
 * Migration script for adding new columns to the database.
 * Run this when the Neon DB proxy is available:
 *   node migrate.js
 */

const { execSync } = require("child_process");

console.log("🚀 Running Prisma migration: 0003_add_terms_duedate_advance_logo\n");

try {
  const output = execSync(
    "npx prisma migrate dev --name add_terms_duedate_advance_logo",
    {
      cwd: __dirname,
      stdio: "inherit",
      env: process.env,
    }
  );
  console.log("\n✅ Migration applied successfully.");
  console.log("Run verification with: node verify-schema.js");
} catch (err) {
  console.error("\n❌ Migration failed. Is the Neon DB proxy running at 127.0.0.1:5433?");
  process.exit(1);
}
