"use server";

import { getAuthSession } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import {
  InvoiceInput,
  createInvoiceDb,
  getInvoiceByIdDb,
  updateInvoiceDb,
  deleteInvoiceDb,
  updateInvoiceStatusDb,
} from "@/lib/invoices-db";

export async function createInvoice(data: InvoiceInput) {
  const session = await getAuthSession();
  const userId = session.user.id;

  try {
    const invoice = await createInvoiceDb(data, userId);
    revalidatePath("/dashboard");
    revalidatePath("/invoices");
    return invoice;
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    console.error("Error creating invoice Server Action:", error);
    throw new Error(error.message || "Failed to create invoice.");
  }
}

export async function getInvoiceById(id: string) {
  const session = await getAuthSession();
  const userId = session.user.id;
  return await getInvoiceByIdDb(id, userId);
}

export async function updateInvoice(id: string, data: InvoiceInput) {
  const session = await getAuthSession();
  const userId = session.user.id;

  try {
    const invoice = await updateInvoiceDb(id, data, userId);
    revalidatePath("/dashboard");
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${id}`);
    revalidatePath(`/invoices/${id}/edit`);
    return invoice;
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    console.error("Error updating invoice Server Action:", error);
    throw new Error(error.message || "Failed to update invoice.");
  }
}

export async function deleteInvoice(id: string) {
  const session = await getAuthSession();
  const userId = session.user.id;

  try {
    const res = await deleteInvoiceDb(id, userId);
    revalidatePath("/dashboard");
    revalidatePath("/invoices");
    return res;
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    console.error("Error deleting invoice Server Action:", error);
    throw new Error("Failed to delete invoice.");
  }
}

export async function updateInvoiceStatus(
  id: string,
  status: "DRAFT" | "SENT" | "PAID"
) {
  const session = await getAuthSession();
  const userId = session.user.id;

  const updated = await updateInvoiceStatusDb(id, status, userId);
  revalidatePath("/dashboard");
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  return updated;
}
