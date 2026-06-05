import React from "react";
import { Metadata } from "next";
import { getInvoiceById } from "@/app/actions/invoices";
import { InvoiceForm } from "@/components/invoice/InvoiceForm";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Edit Invoice - InvoicePro",
  description: "Modify client details, item rows, or terms on an existing invoice.",
};

// Next.js dynamic routing configuration
export const dynamic = "force-dynamic";

interface EditInvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const { id } = await params;

  // Retrieve invoice details (verifies session & ownership internally)
  const invoice = await getInvoiceById(id);

  // Serialize values to avoid Next.js props warnings
  const serializedInvoice = {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    date: invoice.date.toISOString(),
    clientName: invoice.clientName,
    address: invoice.address,
    subject: invoice.subject,
    notes: invoice.notes,
    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount,
    })),
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back link */}
      <div className="flex items-center gap-1 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <Link href={`/invoices/${id}`} className="hover:underline">
          Back to Preview
        </Link>
      </div>

      {/* Reusable Form pre-populated with serialized database values */}
      <InvoiceForm initialData={serializedInvoice} />
    </div>
  );
}
