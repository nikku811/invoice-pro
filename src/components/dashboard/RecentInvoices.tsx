"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string | Date;
  clientName: string;
  total: number;
  status?: "DRAFT" | "SENT" | "PAID";
}

interface RecentInvoicesProps {
  initialInvoices: Invoice[];
}

export function RecentInvoices({ initialInvoices = [] }: RecentInvoicesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Filter invoices based on search query and status filter
  const filteredInvoices = initialInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "ALL" || (invoice.status || "DRAFT") === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string = "DRAFT") => {
    const styles = {
      PAID: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
      SENT: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
      DRAFT: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/50",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
          styles[status as keyof typeof styles] || styles.DRAFT
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col">
      {/* Table Header Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-50 dark:border-slate-800/60">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Invoices</h2>
          <p className="text-xs font-medium text-slate-400 mt-0.5">Manage and track your latest invoices</p>
        </div>

        {/* Controls Layout */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by client or number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl placeholder-slate-400 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="SENT">Sent</option>
            <option value="DRAFT">Draft</option>
          </select>

          {/* Create Invoice Action */}
          <Link
            href="/invoices/new"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl shadow-sm transition-all duration-200 cursor-pointer active:scale-98"
          >
            <svg className="h-4.5 w-4.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Invoice
          </Link>
        </div>
      </div>

      {/* Table Element */}
      {filteredInvoices.length > 0 ? (
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4">Invoice Number</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40 text-sm">
              {filteredInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors"
                >
                  <td className="px-6 py-4.5 font-bold text-slate-900 dark:text-white">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-6 py-4.5 text-slate-700 dark:text-slate-350">
                    {invoice.clientName}
                  </td>
                  <td className="px-6 py-4.5 text-slate-500 dark:text-slate-400">
                    {formatDate(invoice.date)}
                  </td>
                  <td className="px-6 py-4.5 font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-6 py-4.5">{getStatusBadge(invoice.status)}</td>
                  <td className="px-6 py-4.5 text-right space-x-2">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      View
                    </Link>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <Link
                      href={`/invoices/${invoice.id}/edit`}
                      className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="h-16 w-16 bg-slate-50 dark:bg-slate-950/40 text-slate-400 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-850">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No invoices found</h3>
          <p className="text-sm text-slate-400 max-w-sm mt-1">
            {searchQuery || filterStatus !== "ALL"
              ? "Try adjusting your search criteria or filter to see more results."
              : "Get started by creating your first professional invoice today."}
          </p>
          {!searchQuery && filterStatus === "ALL" && (
            <Link
              href="/invoices/new"
              className="mt-5 inline-flex items-center px-4.5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl transition-all shadow-sm active:scale-98"
            >
              Create First Invoice
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
