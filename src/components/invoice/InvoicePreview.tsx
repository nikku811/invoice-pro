"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateInvoicePDF } from "@/lib/pdf";
import { Button } from "../ui/Button";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  date: string | Date;
  clientName: string;
  address?: string | null;
  subject?: string | null;
  subtotal: number;
  total: number;
  totalInWords?: string | null;
  notes?: string | null;
}

interface InvoicePreviewProps {
  invoice: InvoiceData;
  items: InvoiceItem[];
}

export function InvoicePreview({ invoice, items }: InvoicePreviewProps) {
  const router = useRouter();

  const handleDownload = () => {
    // B05 fix: warn user if invoice has > 11 items (PDF template limit)
    if (items.length > 11) {
      const proceed = window.confirm(
        `This invoice has ${items.length} items but the PDF template only shows 11 rows. Items beyond row 11 will not appear in the PDF. Continue anyway?`
      );
      if (!proceed) return;
    }
    generateInvoicePDF(invoice, items);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            // B16 fix: use router.back() so user returns to their origin
            // (could be /invoices, /dashboard, or any other referrer)
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 rounded-lg cursor-pointer"
            title="Back"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {invoice.invoiceNumber}
            </h2>
            <p className="text-xs text-slate-400 font-medium">Created on {formatDate(invoice.date)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/invoices/${invoice.id}/edit`)}
          >
            Edit Invoice
          </Button>
          <Button onClick={handleDownload} className="shadow-sm shadow-indigo-100 dark:shadow-none">
            <svg className="h-4.5 w-4.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download PDF
          </Button>
        </div>
      </div>

      {/* Visual Invoice Mock Page (matches the PDF layout design on-screen) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 sm:p-12 text-slate-850 dark:text-slate-200 font-sans max-w-3xl mx-auto border-slate-300">
        {/* Border wrapper mirroring A4 frame */}
        <div className="border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-200 dark:border-slate-850">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800/40 text-slate-400 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700/50">
                <span className="text-xxs font-black tracking-wide uppercase">Logo</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Organization name</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Organization address<br />hajj<br />jsik<br />jaji
                </p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-black tracking-wider text-slate-900 dark:text-white">
                INVOICE
              </h1>
            </div>
          </div>

          {/* Metadata Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200 dark:border-slate-850 text-sm">
            <div className="space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white flex gap-2">
                <span className="w-24 text-slate-400">#</span>
                <span>: {invoice.invoiceNumber}</span>
              </p>
              <p className="font-semibold text-slate-900 dark:text-white flex gap-2">
                <span className="w-24 text-slate-400">Invoice Date</span>
                <span>: {formatDate(invoice.date)}</span>
              </p>
            </div>
            <div className="border-l border-slate-200 dark:border-slate-850 pl-4 hidden sm:block">
              {/* Spacer matching design layout grid */}
            </div>
          </div>

          {/* Bill To Info */}
          <div className="pb-4 border-b border-slate-200 dark:border-slate-850 text-sm">
            <p className="font-bold text-slate-900 dark:text-white pb-2">Bill to :</p>
            <div className="border-t border-slate-100 dark:border-slate-850 pt-2 text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              <p className="font-semibold text-slate-800 dark:text-slate-350">{invoice.clientName}</p>
              <p className="whitespace-pre-line mt-1">{invoice.address || "N/A"}</p>
            </div>
          </div>

          {/* Subject info */}
          <div className="pb-4 border-b border-slate-200 dark:border-slate-850 text-sm flex gap-3">
            <span className="font-bold text-slate-900 dark:text-white">Subject :</span>
            <span className="text-slate-650 dark:text-slate-350">{invoice.subject || "N/A"}</span>
          </div>

          {/* Table Data list */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border border-slate-200 dark:border-slate-800 border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/40 dark:bg-slate-900/10 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                  <th className="p-3 w-12 text-center border-r border-slate-250 dark:border-slate-800">#</th>
                  <th className="p-3 border-r border-slate-250 dark:border-slate-800">Item & Description</th>
                  <th className="p-3 w-16 text-center border-r border-slate-250 dark:border-slate-800">Qty</th>
                  <th className="p-3 w-24 text-center border-r border-slate-250 dark:border-slate-800">Rate</th>
                  <th className="p-3 w-28 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {/* Pad table with empty rows to match layout height */}
                {Array.from({ length: 11 }).map((_, idx) => {
                  const item = items[idx];
                  return (
                    <tr key={idx} className="h-9">
                      <td className="p-2.5 text-center text-slate-400 border-r border-slate-200 dark:border-slate-800">{idx + 1}</td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-250">
                        {item?.description || ""}
                      </td>
                      <td className="p-2.5 text-center border-r border-slate-200 dark:border-slate-800">{item?.quantity || ""}</td>
                      <td className="p-2.5 text-center border-r border-slate-200 dark:border-slate-800">
                        {item ? formatCurrency(item.rate) : ""}
                      </td>
                      <td className="p-2.5 text-right font-semibold text-slate-800 dark:text-slate-200">
                        {item ? formatCurrency(item.amount) : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 border border-slate-200 dark:border-slate-800 border-collapse text-xs">
            {/* Left Box: Words and Notes */}
            <div className="md:col-span-7 p-4 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 space-y-4">
              <div>
                <p className="font-bold text-slate-400 uppercase text-xxs tracking-wider">Total In Words</p>
                <p className="font-medium text-slate-800 dark:text-slate-350 mt-1">
                  {invoice.totalInWords || "N/A"}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60">
                <p className="font-bold text-slate-800 dark:text-slate-300">Notes</p>
                <p className="text-slate-400 whitespace-pre-line leading-relaxed text-xxs mt-1.5">
                  {invoice.notes || "Debris carting away outside extra charge.\nAny re work / plan change charges extra."}
                </p>
              </div>
            </div>

            {/* Right Box: Calculations & Signature */}
            <div className="md:col-span-5 flex flex-col justify-between">
              {/* Subtotal */}
              <div className="p-3 flex justify-between border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <span>Sub Total</span>
                <span className="font-semibold text-slate-700 dark:text-slate-350">
                  {formatCurrency(invoice.subtotal)}
                </span>
              </div>

              {/* Total */}
              <div className="p-3 flex justify-between border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                <span>Total</span>
                <span className="text-indigo-650 dark:text-indigo-400">
                  {formatCurrency(invoice.total)}
                </span>
              </div>

              {/* Signature Block */}
              <div className="p-6 pt-16 text-center">
                <p className="font-bold text-slate-800 dark:text-slate-350 text-xxs tracking-wider uppercase">
                  Authorized Signature
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
