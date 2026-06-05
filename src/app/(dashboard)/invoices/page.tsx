import React from "react";
import { Metadata } from "next";
import { getAuthSession } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { InvoiceTable } from "@/components/invoice/InvoiceTable";

export const metadata: Metadata = {
  title: "Invoice History - InvoicePro",
  description: "Browse, filter, paginate, search, and download your generated invoices.",
};

// Force dynamic rendering to always query fresh database stats
export const dynamic = "force-dynamic";

interface InvoicesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  // Verify session and fetch current logged-in user
  const session = await getAuthSession();
  const userId = session.user.id;

  // Resolve search parameters safely
  const resolvedParams = await searchParams;
  const search = resolvedParams.search || "";
  const status = resolvedParams.status || "ALL";
  const page = parseInt(resolvedParams.page || "1", 10);
  const limit = 10;
  const skip = (page - 1) * limit;

  // Apply conditional search/status queries
  const whereClause: any = {
    userId,
    ...(status !== "ALL" ? { status } : {}),
    OR: search
      ? [
          { invoiceNumber: { contains: search, mode: "insensitive" } },
          { clientName: { contains: search, mode: "insensitive" } },
        ]
      : undefined,
  };

  // Run queries inside Neon
  const [invoices, totalInvoices] = await Promise.all([
    prisma.invoice.findMany({
      where: whereClause,
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.invoice.count({
      where: whereClause,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalInvoices / limit));

  // Serialize models before passing to React client components
  const serializedInvoices = invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    date: inv.date.toISOString(),
    clientName: inv.clientName,
    address: inv.address,
    subject: inv.subject,
    subtotal: inv.subtotal,
    total: inv.total,
    totalInWords: inv.totalInWords,
    notes: inv.notes,
    status: inv.status as "DRAFT" | "SENT" | "PAID",
    items: inv.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount,
    })),
  }));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <InvoiceTable
        invoices={serializedInvoices}
        currentPage={page}
        totalPages={totalPages}
        totalInvoices={totalInvoices}
      />
    </div>
  );
}
