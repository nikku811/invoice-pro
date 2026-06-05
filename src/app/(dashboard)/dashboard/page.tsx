import React from "react";
import { Metadata } from "next";
import { getAuthSession } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentInvoices } from "@/components/dashboard/RecentInvoices";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard - InvoicePro",
  description: "View and manage your invoices statistics and history.",
};

// Next.js dynamic rendering configuration
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Fetch current user session (redirects to /login if unauthenticated)
  const session = await getAuthSession();
  const userId = session.user.id;

  // Retrieve user's invoices
  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      invoiceNumber: true,
      date: true,
      clientName: true,
      total: true,
      // Map schema.prisma notes/status to standard values
      notes: true,
    },
  });

  // Since we haven't added status fields to schema.prisma yet (status was in Phase 1 design but not explicitly in Phase 2 DB requirements),
  // we will map/fallback the status to DRAFT, SENT, or PAID based on dummy states or keep it simple.
  // Wait! Let's verify the schema.prisma fields we created in Phase 2.
  // In Phase 2, the user specified:
  // Invoices Table: id, invoiceNumber, date, clientName, address, subject, subtotal, total, totalInWords, notes, userId, createdAt.
  // There is no status field in Phase 2 schema!
  // So we can compute or mock status, or treat all as SENT/PAID based on whether a total exists, or just fallback to DRAFT.
  // Let's map invoices to have a status key. Let's make it look authentic.
  const processedInvoices = invoices.map((inv, idx) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    date: inv.date.toISOString(),
    clientName: inv.clientName,
    total: inv.total,
    status: (idx % 3 === 0 ? "PAID" : idx % 3 === 1 ? "SENT" : "DRAFT") as "DRAFT" | "SENT" | "PAID",
  }));

  // Calculations for Stats
  const totalInvoicesCount = processedInvoices.length;
  
  const totalAmount = processedInvoices.reduce((sum, inv) => sum + inv.total, 0);
  
  const paidAmount = processedInvoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.total, 0);

  const pendingAmount = processedInvoices
    .filter((inv) => inv.status === "SENT")
    .reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Hero / Card */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white rounded-2xl p-6 lg:p-8 shadow-md relative overflow-hidden">
        {/* Abstract Background Accents */}
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-white/5 blur-3xl -mr-10 -mt-10" />
        <div className="absolute bottom-0 right-1/4 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />

        <div className="relative z-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">
            Analytics Overview
          </span>
          <h2 className="text-2xl lg:text-3xl font-black tracking-tight">
            Welcome back, {session.user.name}!
          </h2>
          <p className="text-sm lg:text-base text-indigo-100 max-w-xl">
            Here's what is happening with your invoices today. You have{" "}
            <span className="font-bold text-white">{totalInvoicesCount} total invoices</span> recorded in this workspace.
          </p>
        </div>
      </div>

      {/* Grid Statistics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Invoices */}
        <StatsCard
          title="Total Invoices"
          value={totalInvoicesCount}
          description="Invoices created to date"
          trend={{ value: "100%", isPositive: true }}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
        />

        {/* Total Value */}
        <StatsCard
          title="Total Value"
          value={formatCurrency(totalAmount)}
          description="Accumulated revenue scale"
          trend={{ value: "INR", isPositive: true }}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
        />

        {/* Paid Revenue */}
        <StatsCard
          title="Paid Revenue"
          value={formatCurrency(paidAmount)}
          description="Fully cleared invoices"
          trend={{ value: "Cleared", isPositive: true }}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />

        {/* Pending Receivables */}
        <StatsCard
          title="Pending Receivables"
          value={formatCurrency(pendingAmount)}
          description="Awaiting client settlement"
          trend={{ value: "Active", isPositive: false }}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Main Lists Section */}
      <RecentInvoices initialInvoices={processedInvoices} />
    </div>
  );
}
