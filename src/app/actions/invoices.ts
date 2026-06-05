"use server";

import prisma from "@/lib/prisma";
import { getAuthSession, numberToWords, generateInvoiceNumber } from "@/lib/utils";
import { revalidatePath } from "next/cache";

// ============================================================
// Invoice Server Actions
// Scopes all DB operations to the logged-in user for security.
// Calculates totals and "Total in Words" automatically.
// ============================================================

export interface InvoiceItemInput {
  description: string;
  quantity: number;
  rate: number;
}

export interface InvoiceInput {
  date: string | Date;
  clientName: string;
  address?: string;
  subject?: string;
  notes?: string;
  items: InvoiceItemInput[];
}

/**
 * Validates invoice inputs.
 */
function validateInvoiceData(data: InvoiceInput) {
  if (!data.clientName || data.clientName.trim() === "") {
    throw new Error("Client name is required.");
  }
  if (!data.date) {
    throw new Error("Invoice date is required.");
  }
  if (!data.items || data.items.length === 0) {
    throw new Error("At least one item is required.");
  }

  for (const item of data.items) {
    if (!item.description || item.description.trim() === "") {
      throw new Error("Item description is required.");
    }
    if (item.quantity <= 0) {
      throw new Error("Item quantity must be greater than zero.");
    }
    if (item.rate < 0) {
      throw new Error("Item rate cannot be negative.");
    }
  }
}

/**
 * Create a new invoice.
 */
export async function createInvoice(data: InvoiceInput) {
  const session = await getAuthSession();
  const userId = session.user.id;

  validateInvoiceData(data);

  try {
    return await prisma.$transaction(async (tx) => {
      // Get highest invoice number globally for sequential numbering
      const lastInvoice = await tx.invoice.findFirst({
        orderBy: { invoiceNumber: "desc" },
        select: { invoiceNumber: true },
      });

      const nextInvoiceNumber = generateInvoiceNumber(lastInvoice?.invoiceNumber ?? null);

      // Calculations
      let subtotal = 0;
      const itemsData = data.items.map((item) => {
        const amount = Number((item.quantity * item.rate).toFixed(2));
        subtotal += amount;
        return {
          description: item.description.trim(),
          quantity: item.quantity,
          rate: item.rate,
          amount,
        };
      });

      const total = Number(subtotal.toFixed(2));
      const totalInWords = numberToWords(total);

      // Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: nextInvoiceNumber,
          date: new Date(data.date),
          clientName: data.clientName.trim(),
          address: data.address?.trim() || null,
          subject: data.subject?.trim() || null,
          subtotal,
          total,
          totalInWords,
          notes: data.notes?.trim() || null,
          userId,
          items: {
            create: itemsData,
          },
        },
        include: {
          items: true,
        },
      });

      revalidatePath("/dashboard");
      revalidatePath("/invoices");
      return invoice;
    });
  } catch (error: any) {
    // B02 fix: re-throw Next.js redirect so it is not swallowed as a generic error
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    console.error("Error creating invoice Server Action:", error);
    throw new Error(error.message || "Failed to create invoice.");
  }
}

/**
 * Get an invoice by ID.
 * Verifies ownership.
 */
export async function getInvoiceById(id: string) {
  const session = await getAuthSession();
  const userId = session.user.id;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  // Ensure security ownership scope
  if (invoice.userId !== userId) {
    throw new Error("You do not have permission to access this invoice.");
  }

  return invoice;
}

/**
 * Update an existing invoice.
 * Deletes existing items and performs bulk insertion.
 */
export async function updateInvoice(id: string, data: InvoiceInput) {
  const session = await getAuthSession();
  const userId = session.user.id;

  validateInvoiceData(data);

  // Verify ownership and existence first
  const existing = await prisma.invoice.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!existing) {
    throw new Error("Invoice not found.");
  }
  if (existing.userId !== userId) {
    throw new Error("You do not have permission to update this invoice.");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // Delete old items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      // Calculations
      let subtotal = 0;
      const itemsData = data.items.map((item) => {
        const amount = Number((item.quantity * item.rate).toFixed(2));
        subtotal += amount;
        return {
          description: item.description.trim(),
          quantity: item.quantity,
          rate: item.rate,
          amount,
        };
      });

      const total = Number(subtotal.toFixed(2));
      const totalInWords = numberToWords(total);

      // Update Header & Insert New Items
      const invoice = await tx.invoice.update({
        where: { id },
        data: {
          date: new Date(data.date),
          clientName: data.clientName.trim(),
          address: data.address?.trim() || null,
          subject: data.subject?.trim() || null,
          subtotal,
          total,
          totalInWords,
          notes: data.notes?.trim() || null,
          items: {
            create: itemsData,
          },
        },
        include: {
          items: true,
        },
      });

      revalidatePath("/dashboard");
      revalidatePath("/invoices");
      revalidatePath(`/invoices/${id}`);
      return invoice;
    });
  } catch (error: any) {
    // B02 fix: re-throw Next.js redirect so it is not swallowed as a generic error
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    console.error("Error updating invoice Server Action:", error);
    throw new Error(error.message || "Failed to update invoice.");
  }
}

/**
 * Delete an invoice.
 * Verifies ownership.
 */
export async function deleteInvoice(id: string) {
  const session = await getAuthSession();
  const userId = session.user.id;

  // Verify ownership first
  const existing = await prisma.invoice.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!existing) {
    throw new Error("Invoice not found.");
  }
  if (existing.userId !== userId) {
    throw new Error("You do not have permission to delete this invoice.");
  }

  try {
    await prisma.invoice.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    revalidatePath("/invoices");
    return { success: true };
  } catch (error: any) {
    // B02 fix: re-throw Next.js redirect so it is not swallowed as a generic error
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    console.error("Error deleting invoice Server Action:", error);
    throw new Error("Failed to delete invoice.");
  }
}
