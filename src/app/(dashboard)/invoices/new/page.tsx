import React from "react";
import { Metadata } from "next";
import { InvoiceForm } from "@/components/invoice/InvoiceForm";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Create Invoice - InvoicePro",
  description: "Generate a new professional invoice with itemized calculations.",
};

export default function NewInvoicePage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back link */}
      <div className="flex items-center gap-1 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <Link href="/dashboard" className="hover:underline">
          Back to Dashboard
        </Link>
      </div>

      {/* Invoice Form */}
      <InvoiceForm />
    </div>
  );
}
