"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateInvoicePDF, BusinessProfile } from "@/lib/pdf";
import { Modal } from "../ui/Modal";

interface InvoiceItem {
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
  address?: string | null;
  subject?: string | null;
  subtotal: number;
  total: number;
  advance?: number | null;
  terms?: string | null;
  dueDate?: string | Date | null;
  totalInWords?: string | null;
  notes?: string | null;
  status: "DRAFT" | "SENT" | "PAID";
  items: InvoiceItem[];
}

interface InvoiceTableProps {
  invoices: Invoice[];
  currentPage: number;
  totalPages: number;
  totalInvoices: number;
}

export function InvoiceTable({
  invoices,
  currentPage,
  totalPages,
  totalInvoices,
}: InvoiceTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Fetch business profile once for PDF generation
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setProfile(data))
      .catch(() => {});
  }, []);

  // Local state for interactive filtering inputs
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL");

  // Deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // B15 fix: replace alert() with inline error state
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Sync inputs with URL params on back/forward navigation
  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
    setStatusFilter(searchParams.get("status") || "ALL");
  }, [searchParams]);

  // Debounced search updates helper
  const updateQueryParams = (search: string, status: string, page: number) => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);
    if (page > 1) params.set("page", String(page));

    router.push(`/invoices?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQueryParams(searchQuery, statusFilter, 1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatusFilter(newStatus);
    updateQueryParams(searchQuery, newStatus, 1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    updateQueryParams(searchQuery, statusFilter, page);
  };

  // Delete handlers
  const openDeleteModal = (id: string) => {
    setInvoiceToDelete(id);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setInvoiceToDelete(null);
    setDeleteModalOpen(false);
    setIsDeleting(false);
    setDeleteError(null); // B15 fix: reset error on close
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/invoices/${invoiceToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete invoice.");
      }

      closeDeleteModal();
      router.refresh();
    } catch (error) {
      console.error("Delete invoice error:", error);
      // B15 fix: show error inline in modal instead of browser alert()
      setDeleteError("Failed to delete invoice. Please try again.");
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: "DRAFT" | "SENT" | "PAID") => {
    const styles = {
      PAID: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
      SENT: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
      DRAFT: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/50",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
          styles[status]
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
      {/* Header filter controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-50 dark:border-slate-800/60">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Invoice History</h2>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            Displaying {invoices.length} of {totalInvoices} invoices
          </p>
        </div>

        {/* Inputs forms */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="SENT">Sent</option>
            <option value="DRAFT">Draft</option>
          </select>
        </form>
      </div>

      {/* Invoices List Table */}
      {invoices.length > 0 ? (
        <>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Invoice Number</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40 text-sm">
                {invoices.map((invoice, idx) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors"
                  >
                    <td className="px-6 py-4.5 font-bold text-slate-900 dark:text-white">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4.5 text-slate-700 dark:text-slate-350 font-medium">
                      {invoice.clientName}
                    </td>
                    <td className="px-6 py-4.5 text-slate-500 dark:text-slate-400">
                      {formatDate(invoice.date)}
                    </td>
                    <td className="px-6 py-4.5 font-semibold text-slate-905 dark:text-white">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-4.5">{getStatusBadge(invoice.status)}</td>
                    <td className="px-6 py-4.5 text-right space-x-2">
                      <button
                        onClick={() => {
                          generateInvoicePDF(invoice, invoice.items, profile);
                        }}
                        className="text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 cursor-pointer"
                        title="Download PDF"
                      >
                        PDF
                      </button>
                      <span className="text-slate-200 dark:text-slate-800">|</span>
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        View
                      </Link>
                      <span className="text-slate-200 dark:text-slate-800">|</span>
                      <Link
                        href={`/invoices/${invoice.id}/edit`}
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        Edit
                      </Link>
                      <span className="text-slate-200 dark:text-slate-800">|</span>
                      <button
                        onClick={() => openDeleteModal(invoice.id)}
                        className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800/60">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>

              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="h-16 w-16 bg-slate-50 dark:bg-slate-950/45 text-slate-450 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-850">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No invoices found</h3>
          <p className="text-sm text-slate-400 max-w-sm mt-1">
            We couldn't find any invoices matching your search filters. Try updating your filters or search keywords.
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        isConfirming={isDeleting}
        title="Delete Invoice"
        description={
          deleteError
            ? deleteError  // B15 fix: show error inside modal description
            : "Are you absolutely sure you want to delete this invoice? This action cannot be undone and will cascadingly remove all itemized details."
        }
        confirmText="Delete Invoice"
      />
    </div>
  );
}
