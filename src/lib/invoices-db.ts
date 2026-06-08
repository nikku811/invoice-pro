import prisma from "@/lib/prisma";
import { numberToWords, generateInvoiceNumber } from "@/lib/utils";

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
  status?: "DRAFT" | "SENT" | "PAID";
  items: InvoiceItemInput[];
}

/**
 * Validates invoice inputs.
 */
export function validateInvoiceData(data: InvoiceInput) {
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
export async function createInvoiceDb(data: InvoiceInput, userId: string) {
  validateInvoiceData(data);

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
        status: data.status ?? "DRAFT",
        userId,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
      },
    });

    return invoice;
  });
}

/**
 * Get an invoice by ID.
 * Verifies ownership.
 */
export async function getInvoiceByIdDb(id: string, userId: string) {
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
export async function updateInvoiceDb(id: string, data: InvoiceInput, userId: string) {
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
        ...(data.status && ["DRAFT", "SENT", "PAID"].includes(data.status)
          ? { status: data.status }
          : {}),
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
      },
    });

    return invoice;
  });
}

/**
 * Delete an invoice.
 * Verifies ownership.
 */
export async function deleteInvoiceDb(id: string, userId: string) {
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

  await prisma.invoice.delete({
    where: { id },
  });

  return { success: true };
}

/**
 * Update only the status of an invoice.
 */
export async function updateInvoiceStatusDb(
  id: string,
  status: "DRAFT" | "SENT" | "PAID",
  userId: string
) {
  // Verify ownership first
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

  return await prisma.invoice.update({
    where: { id },
    data: { status },
    select: { id: true, status: true },
  });
}
