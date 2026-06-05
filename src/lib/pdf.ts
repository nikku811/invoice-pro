import { jsPDF } from "jspdf";
import { formatCurrency, formatDate } from "./utils";

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceData {
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

export function generateInvoicePDF(invoice: InvoiceData, items: InvoiceItem[]) {
  // Create jsPDF instance (A4 size, portrait, mm units)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Set default font to Helvetica
  doc.setFont("Helvetica");

  // ---------------------------------------------------------
  // 1. Draw Outer Border (Grey frame)
  // ---------------------------------------------------------
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(10, 10, 190, 277); // Outer border spanning A4 page

  // ---------------------------------------------------------
  // 2. Draw Company Logo Header
  // ---------------------------------------------------------
  // Draw Logo Box (dashed grey border as placeholder)
  doc.setDrawColor(200, 200, 200);
  doc.rect(15, 15, 35, 35);
  
  // Draw clean vector logo graphic (circle + hammer/ruler lines)
  doc.setDrawColor(50, 50, 50);
  doc.setLineWidth(1.5);
  doc.circle(32.5, 30, 9); // Circle
  
  doc.setDrawColor(79, 70, 229); // indigo line representing ruler
  doc.setLineWidth(2);
  doc.line(26, 37, 39, 23); 
  
  doc.setDrawColor(220, 38, 38); // red line representing hammer
  doc.line(39, 37, 26, 23); 

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text("Add logo", 32.5, 45, { align: "center" });

  // Organization Information
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text("Organization name", 55, 22);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Organization address\nhajj\njsik\njaji", 55, 28);

  // Large INVOICE Heading
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(15, 15, 15);
  doc.text("INVOICE", 195, 42, { align: "right" });

  // Top Section Separator Line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(10, 53, 200, 53);

  // ---------------------------------------------------------
  // 3. Invoice Metadata (Number & Date)
  // ---------------------------------------------------------
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text("#", 12, 58);
  doc.text("Invoice Date", 12, 64);

  doc.setFont("Helvetica", "normal");
  doc.text(`: ${invoice.invoiceNumber}`, 38, 58);
  doc.text(`: ${formatDate(invoice.date)}`, 38, 64);

  // Divider lines around metadata
  doc.line(105, 53, 105, 68); // Vertical middle line
  doc.line(10, 68, 200, 68);  // Horizontal bottom boundary

  // ---------------------------------------------------------
  // 4. Bill To Section
  // ---------------------------------------------------------
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Bill to :", 12, 73);
  doc.line(10, 75, 200, 75); // Header bottom divider

  // Format client address value
  const clientInfo = `${invoice.clientName}\n${invoice.address || ""}`;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(clientInfo, 12, 80);

  doc.setDrawColor(200, 200, 200);
  doc.line(10, 91, 200, 91); // Section divider line

  // ---------------------------------------------------------
  // 5. Subject Section
  // ---------------------------------------------------------
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text("Subject :", 12, 96);

  doc.setFont("Helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(invoice.subject || "N/A", 28, 96);

  doc.setDrawColor(200, 200, 200);
  doc.line(10, 100, 200, 100); // Bottom subject line

  // ---------------------------------------------------------
  // 6. Items Table Section
  // ---------------------------------------------------------
  // Column alignment bounds (midpoints for text placement)
  const colX = {
    num: 16,
    desc: 25,
    qty: 142.5,
    rate: 161,
    amount: 186,
  };

  // Draw table header row text
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text("#", colX.num, 105, { align: "center" });
  doc.text("Item & Description", colX.desc, 105);
  doc.text("Qty", colX.qty, 105, { align: "center" });
  doc.text("Rate", colX.rate, 105, { align: "center" });
  doc.text("Amount", colX.amount, 105, { align: "center" });

  doc.line(10, 108, 200, 108); // Header divider line

  // Draw 11 empty/filled item rows (A4 page fits 11 rows comfortably)
  let yStart = 108;
  const rowHeight = 9;
  const totalRows = 11;

  for (let i = 0; i < totalRows; i++) {
    const yCurrent = yStart + i * rowHeight;
    const yNext = yCurrent + rowHeight;
    const item = items[i];

    // Draw horizontal row bottom line
    doc.line(10, yNext, 200, yNext);

    // Draw row number index
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(String(i + 1), colX.num, yCurrent + 6, { align: "center" });

    // Print values if row item exists
    if (item) {
      doc.setTextColor(50, 50, 50);
      // Description text truncation for cell overflow safety
      const descText = doc.splitTextToSize(item.description, 110);
      doc.text(descText[0] || "", colX.desc, yCurrent + 6);

      doc.text(String(item.quantity), colX.qty, yCurrent + 6, { align: "center" });
      doc.text(formatCurrency(item.rate), colX.rate, yCurrent + 6, { align: "center" });
      doc.text(formatCurrency(item.amount), colX.amount, yCurrent + 6, { align: "center" });
    }
  }

  // Draw Table Vertical column dividers
  doc.line(22, 100, 22, 207);   // Divider between # and Description
  doc.line(135, 100, 135, 207); // Divider between Description and Qty
  doc.line(150, 100, 150, 207); // Divider between Qty and Rate
  doc.line(172, 100, 172, 207); // Divider between Rate and Amount

  // ---------------------------------------------------------
  // 7. Bottom Section (Totals, T&C, and Signatures)
  // ---------------------------------------------------------
  const yBottomStart = 207;

  // Split vertically in half
  doc.line(120, yBottomStart, 120, 287); // Middle vertical separator

  // 7.1 Left Side: Total in Words and Notes
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text("Total In Words", 12, yBottomStart + 4);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  const wordsText = doc.splitTextToSize(invoice.totalInWords || "N/A", 100);
  doc.text(wordsText, 12, yBottomStart + 9);

  // Notes divider
  doc.line(10, yBottomStart + 21, 120, yBottomStart + 21);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(35, 35, 35);
  doc.text("Notes", 12, yBottomStart + 26);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  const notesContent = invoice.notes || 
    "Debris carting away outside extra charge.\nAny re work / plan change charges extra.\nWater, electricity at site provided by client.\n50% advance payment.\nRate is not fix it's depends on design.\nLaminate is using under Rs.1800 per laminate.\nPlywood is using Semi Marine.\nHardware using standard and regular fitting(Not Antic).";
  const notesText = doc.splitTextToSize(notesContent, 104);
  doc.text(notesText, 12, yBottomStart + 31);

  // 7.2 Right Side: Subtotal, Total & Authorized Signature
  // Sub Total Row
  doc.line(120, yBottomStart + 8, 200, yBottomStart + 8);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Sub Total", 155, yBottomStart + 5.5, { align: "right" });
  doc.setTextColor(30, 30, 30);
  doc.text(formatCurrency(invoice.subtotal), 195, yBottomStart + 5.5, { align: "right" });

  // Total Row
  doc.line(120, yBottomStart + 16, 200, yBottomStart + 16);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Total", 155, yBottomStart + 13, { align: "right" });
  doc.text(formatCurrency(invoice.total), 195, yBottomStart + 13, { align: "right" });

  // Authorized Signature Box
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text("Authorized Signature", 160, 265, { align: "center" });

  // ---------------------------------------------------------
  // 8. Save & Download PDF
  // ---------------------------------------------------------
  doc.save(`${invoice.invoiceNumber}.pdf`);
}
