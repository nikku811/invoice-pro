// ============================================================
// Utility Functions
// Shared helper functions used across the application
// ============================================================

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Get the current authenticated session.
 * Redirects to /login if not authenticated.
 * Use in Server Components and Server Actions.
 */
export async function getAuthSession() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session;
}

/**
 * Convert a number to words (Indian numbering system).
 * Used for generating "Total in Words" on invoices.
 * Example: 15000 → "Fifteen Thousand Only"
 */
export function numberToWords(num: number): string {
  if (num === 0) return "Zero Only";
  // B12 fix: handle negative numbers gracefully
  if (num < 0) return "Negative " + numberToWords(Math.abs(num));

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
    "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen",
    "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ];

  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty",
    "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  const scales = ["", "Thousand", "Lakh", "Crore"];

  function convertGroup(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convertGroup(n % 100) : "");
  }

  // Handle decimals (paise)
  const intPart = Math.floor(Math.abs(num));
  const decPart = Math.round((Math.abs(num) - intPart) * 100);

  if (intPart === 0 && decPart === 0) return "Zero Only";

  // Indian numbering: first group is 3 digits (hundreds), then groups of 2
  const groups: number[] = [];
  let remaining = intPart;

  // First group: last 3 digits
  groups.push(remaining % 1000);
  remaining = Math.floor(remaining / 1000);

  // Subsequent groups: 2 digits each (thousand, lakh, crore)
  while (remaining > 0) {
    groups.push(remaining % 100);
    remaining = Math.floor(remaining / 100);
  }

  let result = "";
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue;
    result += convertGroup(groups[i]) + (scales[i] ? " " + scales[i] : "") + " ";
  }

  result = result.trim();

  if (decPart > 0) {
    result += " and " + convertGroup(decPart) + " Paise";
  }

  return result + " Only";
}

/**
 * Generate the next invoice number.
 * Format: INV-0001, INV-0002, etc.
 */
export function generateInvoiceNumber(lastNumber: string | null): string {
  if (!lastNumber) {
    return "INV-0001";
  }

  const numPart = parseInt(lastNumber.replace("INV-", ""), 10);
  const nextNum = numPart + 1;
  // B17 fix: use padStart(5) so numbers stay consistent past INV-9999
  return `INV-${nextNum.toString().padStart(5, "0")}`;
}

/**
 * Format a date to a readable string.
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format currency in Indian Rupee format.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}
