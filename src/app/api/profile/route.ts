import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBusinessProfile, upsertBusinessProfile } from "@/app/actions/profile";

// ============================================================
// Business Profile API Endpoint
// GET  /api/profile — returns the current user's profile (or null)
// PUT  /api/profile — creates or updates the profile
// ============================================================

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getBusinessProfile();
    return NextResponse.json(profile ?? null, { status: 200 });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve business profile." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const profile = await upsertBusinessProfile(body);
    return NextResponse.json(profile, { status: 200 });
  } catch (error: any) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save business profile." },
      { status: error.message ? 400 : 500 }
    );
  }
}
