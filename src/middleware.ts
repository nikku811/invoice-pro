// ============================================================
// Auth.js Middleware
// Protects routes using the `authorized` callback in auth.ts
// ============================================================

export { auth as middleware } from "@/lib/auth";

export const config = {
  // Run middleware on these routes
  // Excludes: api/auth (Auth.js needs public access), static files, images
  matcher: [
    "/dashboard/:path*",
    "/invoices/:path*",
    "/login",
    "/register",
  ],
};
