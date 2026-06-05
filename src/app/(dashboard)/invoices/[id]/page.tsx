import React from "react";
import { Metadata } from "next";
import { getInvoiceById } from "@/app/actions/invoices";
import { InvoicePreview } from "@/components/invoice/InvoicePreview";

export const metadata: Metadata = {
  title: "View Invoice - InvoicePro",
  description: "Preview invoice details and export formatted copies to PDF.",
};

// Next.js dynamic routing configuration
export const dynamic = "force-dynamic";

interface ViewInvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function ViewInvoicePage({ params }: ViewInvoicePageProps) {
  const { id } = await params;

  // Retrieve invoice details (verifies user session and ownership internally)
  const invoice = await getInvoiceById(id);

  // Map database dates to ISO Strings to avoid next serialization issues
  const serializedInvoice = {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    date: invoice.date.toISOString(),
    clientName: invoice.clientName,
    address: invoice.address,
    subject: invoice.subject,
    subtotal: invoice.subtotal,
    total: invoice.total,
    totalInWords: invoice.totalInWords,
    notes: invoice.notes,
  };

  const serializedItems = invoice.items.map((item) => ({
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    rate: item.rate,
    amount: item.amount,
  }));

  return <InvoicePreview invoice={serializedInvoice} items={serializedItems} />;
}
