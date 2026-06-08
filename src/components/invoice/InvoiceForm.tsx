"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { formatCurrency } from "@/lib/utils";

interface InvoiceItemInput {
  id?: string; // used for React rendering key
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceFormProps {
  initialData?: {
    id: string;
    invoiceNumber: string;
    date: string | Date;
    clientName: string;
    address?: string | null;
    subject?: string | null;
    notes?: string | null;
    terms?: string | null;
    dueDate?: string | Date | null;
    advance?: number | null;
    status?: string | null;
    items: {
      description: string;
      quantity: number;
      rate: number;
      amount: number;
    }[];
  };
}

export function InvoiceForm({ initialData }: InvoiceFormProps) {
  const router = useRouter();
  const isEditMode = !!initialData;

  const [formData, setFormData] = useState({
    date: "",
    clientName: "",
    address: "",
    subject: "",
    notes: "",
    terms: "",
    dueDate: "",
    advance: 0,
    status: "DRAFT" as "DRAFT" | "SENT" | "PAID",
  });

  const [items, setItems] = useState<InvoiceItemInput[]>([
    { description: "", quantity: 1, rate: 0, amount: 0 },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // Pre-fill form if in Edit Mode
  useEffect(() => {
    if (initialData) {
      const formattedDate = new Date(initialData.date).toISOString().split("T")[0];
      const formattedDueDate = initialData.dueDate
        ? new Date(initialData.dueDate).toISOString().split("T")[0]
        : "";
      setFormData({
        date: formattedDate,
        clientName: initialData.clientName || "",
        address: initialData.address || "",
        subject: initialData.subject || "",
        notes: initialData.notes || "",
        terms: initialData.terms || "",
        dueDate: formattedDueDate,
        advance: initialData.advance ?? 0,
        status: (initialData.status as "DRAFT" | "SENT" | "PAID") || "DRAFT",
      });

      const formattedItems = initialData.items.map((item, idx) => ({
        id: String(idx),
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.quantity * item.rate,
      }));
      setItems(formattedItems.length > 0 ? formattedItems : [{ description: "", quantity: 1, rate: 0, amount: 0 }]);
    } else {
      // Default to today's date in creation mode
      setFormData((prev) => ({
        ...prev,
        date: new Date().toISOString().split("T")[0],
      }));
    }
  }, [initialData]);

  // Handle header field changes (inputs, textareas, selects)
  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: id === "advance" ? Math.max(0, parseFloat(value) || 0) : value,
    }));
    if (errors[id]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  // Handle item row changes
  const handleItemChange = (index: number, field: keyof InvoiceItemInput, value: any) => {
    setItems((prevItems) => {
      const updated = [...prevItems];
      const item = { ...updated[index] };

      if (field === "description") {
        item.description = value;
      } else if (field === "quantity") {
        // B13 fix: parse as integer (floor), min 1 to match Prisma Int schema
        item.quantity = Math.max(1, Math.floor(parseInt(value, 10) || 1));
        item.amount = item.quantity * item.rate;
      } else if (field === "rate") {
        item.rate = Math.max(0, parseFloat(value) || 0);
        item.amount = item.quantity * item.rate;
      }

      updated[index] = item;
      return updated;
    });

    // B10 fix: clear both description and quantity errors for the row
    if (errors[`item-${index}`]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`item-${index}`];
        return newErrors;
      });
    }
    if (errors[`item-${index}-qty`]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`item-${index}-qty`];
        return newErrors;
      });
    }
  };

  // Add a new item row
  const addItemRow = () => {
    setItems((prev) => [...prev, { id: String(Date.now()), description: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  // Remove an item row
  const removeItemRow = (index: number) => {
    if (items.length === 1) return; // Keep at least one row
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculate invoice totals dynamically
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const advance = formData.advance;
  const total = subtotal;
  const balanceDue = Math.max(0, total - advance);

  // Validate form fields
  const validate = () => {
    const tempErrors: Record<string, string> = {};

    if (!formData.clientName.trim()) {
      tempErrors.clientName = "Client name is required.";
    }
    if (!formData.date) {
      tempErrors.date = "Invoice date is required.";
    }
    if (formData.advance < 0) {
      tempErrors.advance = "Advance cannot be negative.";
    }

    items.forEach((item, index) => {
      if (!item.description.trim()) {
        tempErrors[`item-${index}`] = "Description is required.";
      }
      // B10 fix: use Math.max(1,...) so quantity=0 is actually invalid client-side
      if (item.quantity <= 0) {
        tempErrors[`item-${index}-qty`] = "Qty must be ≥ 1.";
      }
    });

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setIsLoading(true);

    const payload = {
      date: formData.date,
      clientName: formData.clientName,
      address: formData.address,
      subject: formData.subject,
      notes: formData.notes,
      terms: formData.terms || null,
      dueDate: formData.dueDate || null,
      advance: formData.advance,
      status: formData.status,
      items: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
      })),
    };

    try {
      const endpoint = isEditMode ? `/api/invoices/${initialData.id}` : "/api/invoices";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save invoice.");
      }

      // Bug 2 fix: redirect to invoice preview in edit mode, dashboard in create mode
      if (isEditMode) {
        router.push(`/invoices/${initialData.id}`);
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setServerError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Save Status / Errors */}
      {serverError && (
        <div className="p-4 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-2xl dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400">
          {serverError}
        </div>
      )}

      {/* Header Info Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 lg:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/60 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEditMode ? "Edit Invoice Details" : "Create New Invoice"}
            </h2>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Fill in client information and billing details
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400 uppercase block tracking-wider">
              Invoice Number
            </span>
            <span className="text-sm font-black text-indigo-650 dark:text-indigo-400">
              {isEditMode ? initialData.invoiceNumber : "Auto-assigned (e.g. INV-0001)"}
            </span>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Client Name"
            id="clientName"
            placeholder="Enter client's full name"
            value={formData.clientName}
            onChange={handleHeaderChange}
            error={errors.clientName}
            disabled={isLoading}
          />

          <Input
            label="Invoice Date"
            id="date"
            type="date"
            value={formData.date}
            onChange={handleHeaderChange}
            error={errors.date}
            disabled={isLoading}
          />

          {/* Invoice Status */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Invoice Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={handleHeaderChange}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm cursor-pointer"
            >
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          {/* Subject */}
          <Input
            label="Subject"
            id="subject"
            placeholder="e.g. Running Bill – Labour Charges"
            value={formData.subject}
            onChange={handleHeaderChange}
            disabled={isLoading}
          />

          {/* Terms */}
          <Input
            label="Terms"
            id="terms"
            placeholder="e.g. Due on Receipt, Net 30, Custom"
            value={formData.terms}
            onChange={handleHeaderChange}
            disabled={isLoading}
          />

          {/* Due Date */}
          <Input
            label="Due Date"
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={handleHeaderChange}
            disabled={isLoading}
          />

          {/* Client Address — full width */}
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label htmlFor="address" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Client Address
            </label>
            <textarea
              id="address"
              rows={3}
              placeholder="Enter client's billing address"
              value={formData.address}
              onChange={handleHeaderChange}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-955 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Line Items Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 lg:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Invoice Items</h2>
          <p className="text-xs font-medium text-slate-400 mt-0.5">Add list items, quantities, and rates — unlimited rows supported</p>
        </div>

        {/* Dynamic Items Layout */}
        <div className="space-y-4">
          {/* Header Row (Desktop only) */}
          <div className="hidden md:grid grid-cols-12 gap-4 pb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <div className="col-span-6">Description</div>
            <div className="col-span-2">Quantity</div>
            <div className="col-span-2">Rate (₹)</div>
            <div className="col-span-2 text-right">Amount (₹)</div>
          </div>

          {/* Rows List */}
          {items.map((item, index) => (
            <div
              key={item.id ?? index}
              className="relative p-4 md:p-0 bg-slate-50/40 dark:bg-slate-950/10 md:bg-transparent border border-slate-100 dark:border-slate-800/40 md:border-transparent rounded-2xl md:rounded-none grid grid-cols-12 gap-4 items-center animate-in fade-in duration-200"
            >
              {/* Description Input */}
              <div className="col-span-12 md:col-span-6 flex flex-col md:block">
                <span className="md:hidden text-xs font-bold text-slate-400 mb-1 uppercase">Description</span>
                <input
                  type="text"
                  placeholder="Item description"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, "description", e.target.value)}
                  disabled={isLoading}
                  className={`w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm ${
                    errors[`item-${index}`] ? "border-red-500 focus:ring-red-500" : ""
                  }`}
                />
                {errors[`item-${index}`] && (
                  <span className="text-xxs text-red-500 font-semibold mt-1 block">
                    {errors[`item-${index}`]}
                  </span>
                )}
              </div>

              {/* Quantity Input */}
              <div className="col-span-6 md:col-span-2 flex flex-col md:block">
                <span className="md:hidden text-xs font-bold text-slate-400 mb-1 uppercase">Quantity</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="1"
                  value={item.quantity || ""}
                  onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                  disabled={isLoading}
                  className={`w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm ${
                    errors[`item-${index}-qty`] ? "border-red-500" : ""
                  }`}
                />
                {/* B10 fix: display qty error message */}
                {errors[`item-${index}-qty`] && (
                  <span className="text-xs text-red-500 font-semibold mt-1 block">
                    {errors[`item-${index}-qty`]}
                  </span>
                )}
              </div>

              {/* Rate Input */}
              <div className="col-span-6 md:col-span-2 flex flex-col md:block">
                <span className="md:hidden text-xs font-bold text-slate-400 mb-1 uppercase">Rate</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={item.rate || ""}
                  onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              {/* Dynamic Amount */}
              <div className="col-span-12 md:col-span-2 flex justify-between items-center md:justify-end gap-4 border-t border-slate-50 md:border-0 pt-3 md:pt-0 mt-2 md:mt-0">
                <span className="md:hidden text-xs font-bold text-slate-400 uppercase">Amount</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(item.amount)}
                  </span>

                  {/* Remove Row Button */}
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(index)}
                      disabled={isLoading}
                      className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                      title="Remove Row"
                    >
                      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Row & Subtotals */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 pt-4 border-t border-slate-50 dark:border-slate-800/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItemRow}
            disabled={isLoading}
            className="w-full md:w-auto"
          >
            <svg className="h-4.5 w-4.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Line Item
          </Button>

          {/* Subtotals Box */}
          <div className="w-full md:w-80 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/40 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-700 dark:text-slate-350">
                {formatCurrency(subtotal)}
              </span>
            </div>

            {/* Advance input row */}
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-3">
              <label htmlFor="advance" className="text-sm font-medium shrink-0 mr-3">
                Advance (−)
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400">₹</span>
                <input
                  id="advance"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.advance || ""}
                  onChange={handleHeaderChange}
                  disabled={isLoading}
                  className="w-32 px-2.5 py-1.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-right"
                />
              </div>
            </div>

            <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-850">
              <span>Total</span>
              <span className="text-indigo-600 dark:text-indigo-400">
                {formatCurrency(total)}
              </span>
            </div>

            {advance > 0 && (
              <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-200 pt-2 border-t border-slate-100 dark:border-slate-850">
                <span>Balance Due</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(balanceDue)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes / T&C Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 lg:p-8 shadow-sm flex flex-col gap-2">
        <label htmlFor="notes" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Invoice Notes / Terms & Conditions
        </label>
        <textarea
          id="notes"
          rows={4}
          placeholder="Enter payment instructions, bank details, or terms & conditions"
          value={formData.notes}
          onChange={handleHeaderChange}
          disabled={isLoading}
          className="w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-955 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm"
        />
      </div>

      {/* Form Submission Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            // Bug 3 fix: Cancel goes to preview in edit mode, dashboard in create mode
            isEditMode
              ? router.push(`/invoices/${initialData.id}`)
              : router.push("/dashboard")
          }
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEditMode ? "Save Changes" : "Save Invoice"}
        </Button>
      </div>
    </form>
  );
}
