// ============================================================
// Registration API Route
// POST /api/register
// Creates a new user account with hashed password
//
// NOTE: Moved from /api/auth/register to avoid NextAuth wildcard
// conflict with [...nextauth] which intercepts all /api/auth/* routes.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// -------------------------------------------------------
// FIX #1 — Lazy-import Prisma inside the handler.
//
// Root cause of "Unexpected end of JSON input":
//   When Prisma's PrismaClient is initialised at module level
//   (top-of-file import) and the DATABASE_URL is invalid /
//   unreachable, the module throws during Next.js compilation
//   or at first request. Next.js catches that module-level
//   crash and returns an empty HTTP 500 with NO body at all.
//   The frontend calls `response.json()` on that empty body
//   and throws "Unexpected end of JSON input" — the error you
//   see on the register page.
//
//   By importing Prisma *inside* the handler we:
//     a) Keep the module loadable even when the DB is down.
//     b) Let our try/catch intercept the Prisma error.
//     c) Always return a proper JSON body on failure.
// -------------------------------------------------------

// -------------------------------------------------------
// FIX #2 — Guard against missing / placeholder env vars
// before even trying to talk to the database.
// This gives the developer a clear, actionable error message
// instead of a cryptic Prisma connection error.
// -------------------------------------------------------
function getDatabaseConfig(): { ok: true } | { ok: false; message: string } {
  const url = process.env.DATABASE_URL ?? "";
  if (
    !url ||
    url.includes("YOUR_PASSWORD") ||
    url.includes("localhost") === false && !url.startsWith("postgresql://")
  ) {
    // Only block obviously broken placeholders; real URLs pass through.
    if (!url || url.includes("YOUR_PASSWORD")) {
      return {
        ok: false,
        message:
          "Database is not configured. Please set a valid DATABASE_URL in your .env file.",
      };
    }
  }
  return { ok: true };
}

// -------------------------------------------------------
// Only allow POST requests.
// Returning 405 JSON for any other HTTP method ensures the
// client always gets a parseable response body.
// -------------------------------------------------------
export async function GET() {
  // FIX #3 — Explicit method-not-allowed JSON for GET requests.
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405, headers: { Allow: "POST" } }
  );
}

export async function POST(request: NextRequest) {
  try {
    // -------------------------------------------------------
    // FIX #4 — Safely parse the request body.
    // If the client sends a malformed / empty body,
    // request.json() itself throws a SyntaxError.
    // We catch that specifically and return 400 JSON instead
    // of letting it bubble up to an uncaught 500.
    // -------------------------------------------------------
    let body: { name?: unknown; email?: unknown; password?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body. Expected JSON with name, email, and password." },
        { status: 400 }
      );
    }

    const { name, email, password } = body;

    // -------------------------------------------------------
    // Validation — all fields must be non-empty strings
    // -------------------------------------------------------
    if (
      !name || typeof name !== "string" ||
      !email || typeof email !== "string" ||
      !password || typeof password !== "string"
    ) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters long." },
        { status: 400 }
      );
    }

    // -------------------------------------------------------
    // FIX #2 (continued) — Check env vars before DB access.
    // -------------------------------------------------------
    const dbConfig = getDatabaseConfig();
    if (!dbConfig.ok) {
      console.error("[register] DB config error:", dbConfig.message);
      return NextResponse.json(
        { error: dbConfig.message },
        { status: 503 } // 503 Service Unavailable — DB not ready
      );
    }

    // -------------------------------------------------------
    // FIX #1 (continued) — Lazy import of Prisma singleton.
    // Any Prisma initialisation errors are now caught by the
    // outer try/catch and converted to a proper JSON 500.
    // -------------------------------------------------------
    const { default: prisma } = await import("@/lib/prisma");

    // -------------------------------------------------------
    // Check for existing user
    // -------------------------------------------------------
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // -------------------------------------------------------
    // Hash password and create user
    // -------------------------------------------------------
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
      },
      // FIX #5 — Only select safe fields; never return the
      // hashed password in the API response.
      select: { id: true, name: true, email: true, createdAt: true },
    });

    return NextResponse.json(
      {
        message: "Account created successfully.",
        user,
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    // -------------------------------------------------------
    // FIX #6 — Detailed server-side logging + always return
    // a valid JSON body. Before this fix the catch block could
    // itself throw if `error` was not an Error instance.
    // -------------------------------------------------------
    const message =
      error instanceof Error ? error.message : "Unknown error";

    // Detect Prisma / DB connection errors and surface a clear
    // message rather than a generic "Something went wrong".
    const isPrismaConnectionError =
      message.includes("ECONNREFUSED") ||
      message.includes("ENOTFOUND") ||
      message.includes("connect ETIMEDOUT") ||
      message.includes("Can't reach database") ||
      message.includes("invalid type: unit value"); // Neon WASM quirk

    console.error("[register] Registration error:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (isPrismaConnectionError) {
      return NextResponse.json(
        {
          error:
            "Cannot connect to the database. Please check your DATABASE_URL in .env and ensure the Neon database is accessible.",
        },
        { status: 503 }
      );
    }

    // Generic fallback — still always valid JSON
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
