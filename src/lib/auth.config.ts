import type { NextAuthConfig } from "next-auth";

// ============================================================
// Auth.js Edge-Compatible Configuration
// Contains only callbacks, sessions, and routing settings
// WITHOUT database or cryptography dependencies.
// ============================================================

export const authConfig = {
  providers: [], // Empty array, will be populated in auth.ts with database-dependent providers
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add custom user.id into the JWT token
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      // Pass custom user.id from token into the session context
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },

    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuth =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");
      const isOnProtected =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/invoices") ||
        nextUrl.pathname.startsWith("/settings");

      // Redirect authenticated users away from login/register pages
      if (isLoggedIn && isOnAuth) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      // Block unauthenticated access to dashboard/invoice pages
      if (!isLoggedIn && isOnProtected) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      return true;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
