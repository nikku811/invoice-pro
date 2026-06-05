// ============================================================
// TypeScript Type Declarations
// Extends Auth.js default types with custom fields
// ============================================================

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Extend the built-in session.user with our custom `id` field
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
