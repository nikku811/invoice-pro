import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createInvoice } from "@/app/actions/invoices";

// ============================================================
// Invoices Base API Endpoint
// GET /api/invoices - Retrieves all invoices of the current user
// POST /api/invoices - Creates a new invoice for the user
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    // Retrieve user's invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        userId: session.user.id,
        OR: search
          ? [
              { invoiceNumber: { contains: search, mode: "insensitive" } },
              { clientName: { contains: search, mode: "insensitive" } },
            ]
          : undefined,
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(invoices, { status: 200 });
  } catch (error) {
    console.error("GET /api/invoices error:", error);
    return NextResponse.json(
      { error: "Internal server error. Failed to retrieve invoices." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Delegate to Server Action to reuse validation and transaction logic
    const invoice = await createInvoice(body);

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/invoices error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create invoice." },
      { status: error.message ? 400 : 500 }
    );
  }
}
