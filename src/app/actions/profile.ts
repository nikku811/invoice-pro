"use server";

import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/utils";
import { revalidatePath } from "next/cache";

// ============================================================
// Business Profile Server Actions
// All operations are scoped to the currently logged-in user.
// ============================================================

export interface BusinessProfileInput {
  orgName: string;
  orgAddress?: string;
  orgPhone?: string;
  orgEmail?: string;
  orgWebsite?: string;
  orgGstin?: string;
}

/**
 * Fetch the business profile for the current user.
 * Returns null if no profile has been created yet.
 */
export async function getBusinessProfile() {
  const session = await getAuthSession();
  const userId = session.user.id;

  const profile = await prisma.businessProfile.findUnique({
    where: { userId },
  });

  return profile;
}

/**
 * Create or update the business profile for the current user.
 * Uses upsert so first-time save creates and subsequent saves update.
 */
export async function upsertBusinessProfile(data: BusinessProfileInput) {
  const session = await getAuthSession();
  const userId = session.user.id;

  if (!data.orgName || data.orgName.trim() === "") {
    throw new Error("Organization name is required.");
  }

  const profile = await prisma.businessProfile.upsert({
    where: { userId },
    create: {
      userId,
      orgName: data.orgName.trim(),
      orgAddress: data.orgAddress?.trim() || null,
      orgPhone: data.orgPhone?.trim() || null,
      orgEmail: data.orgEmail?.trim() || null,
      orgWebsite: data.orgWebsite?.trim() || null,
      orgGstin: data.orgGstin?.trim() || null,
    },
    update: {
      orgName: data.orgName.trim(),
      orgAddress: data.orgAddress?.trim() || null,
      orgPhone: data.orgPhone?.trim() || null,
      orgEmail: data.orgEmail?.trim() || null,
      orgWebsite: data.orgWebsite?.trim() || null,
      orgGstin: data.orgGstin?.trim() || null,
    },
  });

  revalidatePath("/settings");
  return profile;
}
