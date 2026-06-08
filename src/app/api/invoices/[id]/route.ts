import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getInvoiceByIdDb, updateInvoiceDb, deleteInvoiceDb } from "@/lib/invoices-db";

// ============================================================
// Single Invoice Endpoint
// GET /api/invoices/[id] - Retrieves one invoice details
// PUT /api/invoices/[id] - Updates invoice headers & items
// DELETE /api/invoices/[id] - Removes an invoice
// ============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const invoice = await getInvoiceByIdDb(id, session.user.id);

    return NextResponse.json(invoice, { status: 200 });
  } catch (error: any) {
    console.error(`GET /api/invoices/[id] error:`, error);
    const status = error.message.includes("permission") ? 403 : error.message.includes("found") ? 404 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to retrieve invoice." },
      { status }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Call direct database helper instead of Server Action
    const invoice = await updateInvoiceDb(id, body, session.user.id);

    return NextResponse.json(invoice, { status: 200 });
  } catch (error: any) {
    console.error(`PUT /api/invoices/[id] error:`, error);
    const status = error.message.includes("permission") ? 403 : error.message.includes("found") ? 404 : 400;
    return NextResponse.json(
      { error: error.message || "Failed to update invoice." },
      { status }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deleteInvoiceDb(id, session.user.id);

    return NextResponse.json({ message: "Invoice deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error(`DELETE /api/invoices/[id] error:`, error);
    const status = error.message.includes("permission") ? 403 : error.message.includes("found") ? 404 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to delete invoice." },
      { status }
    );
  }
}
