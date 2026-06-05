// ============================================================
// Next.js 16 Proxy (replaces middleware.ts)
//
// In Next.js 16 the "middleware" file convention was renamed to
// "proxy". This file is the edge-safe route protection layer.
//
// It only uses authConfig (no Prisma / bcrypt) so it stays
// within the edge-runtime size limit.
// ============================================================

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Create a lightweight NextAuth instance using only the
// edge-safe config (no database / crypto dependencies).
const { auth } = NextAuth(authConfig);

// -------------------------------------------------------
// Named "proxy" export — required by Next.js 16.
// This replaces "export default" from middleware.ts.
// -------------------------------------------------------
export const proxy = auth;

// -------------------------------------------------------
// Route matcher — same routes as before.
// Only these paths will be processed by the proxy function.
// -------------------------------------------------------
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/invoices/:path*",
    "/login",
    "/register",
  ],
};
