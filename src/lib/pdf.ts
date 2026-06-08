import { jsPDF } from "jspdf";
import { formatDate } from "./utils";

// ============================================================
// PDF Generation Engine — Dynamic Multi-Page Layout
// Uses a cursor-based Y positioning system so rows are never
// clipped and pages are added automatically when content overflows.
// ============================================================

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string | Date;
  terms?: string | null;
  dueDate?: string | Date | null;
  clientName: string;
  address?: string | null;
  subject?: string | null;
  subtotal: number;
  advance?: number | null;
  total: number;
  totalInWords?: string | null;
  notes?: string | null;
}

export interface BusinessProfile {
  orgName: string;
  orgAddress?: string | null;
  orgPhone?: string | null;
  orgEmail?: string | null;
  orgWebsite?: string | null;
  orgGstin?: string | null;
  orgLogo?: string | null;
}

// ------------------------------------------------------------
// Page Layout Constants (all in mm, A4 portrait)
// ------------------------------------------------------------
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 10;          // outer margin on all sides
const CONTENT_W = PAGE_W - MARGIN * 2;  // 190mm usable width
const PAGE_BOTTOM = PAGE_H - 20;        // 277mm — leave 20mm footer clearance

// Table column X positions (absolute from left edge of page)
const COL = {
  border: MARGIN,           // 10 — outer left border
  num: 16,                  // # column center
  descStart: 23,            // Description text start
  descEnd: 120,             // Description column right edge
  qtyCenter: 132,           // Qty column center
  rateCenter: 153,          // Rate column center
  amountRight: 198,         // Amount column right align
  right: MARGIN + CONTENT_W, // 200 — outer right border
};

const ROW_H = 8;            // mm per item row
const HEADER_H = 7;         // mm for table header row

// ------------------------------------------------------------
// PDF-safe currency formatter (₹ not supported in built-in fonts)
// Outputs: Rs. 1,28,290.00 format matching sample invoices
// ------------------------------------------------------------
function fmtCurrency(amount: number): string {
  // Indian numbering: groups of 2 after first 3 digits
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  return `Rs. ${formatted}`;
}

// ------------------------------------------------------------
// Sanitize text for jsPDF built-in fonts
// Strips characters outside Latin-1 (ISO-8859-1) range that
// would otherwise render as garbage glyphs (Ø, =, P etc.)
// ------------------------------------------------------------
function sanitize(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")   // smart single quotes → '
    .replace(/[\u201C\u201D]/g, '"')   // smart double quotes → "
    .replace(/\u2013/g, "-")           // en dash → -
    .replace(/\u2014/g, "--")          // em dash → --
    .replace(/\u2026/g, "...")         // ellipsis → ...
    .replace(/[^\x00-\xFF]/g, "");     // strip remaining non-Latin-1
}

// ------------------------------------------------------------
// Draw the outer A4 border frame
// ------------------------------------------------------------
function drawPageBorder(doc: jsPDF) {
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN, MARGIN, CONTENT_W, PAGE_H - MARGIN * 2);
}

// ------------------------------------------------------------
// Draw header: logo + org info + "TAX INVOICE" title
// Returns the Y position after the header separator line
// ------------------------------------------------------------
function drawHeader(doc: jsPDF, profile: BusinessProfile | null | undefined): number {
  const logoX = MARGIN + 5;
  const logoY = MARGIN + 5;
  const logoW = 35;
  const logoH = 35;

  // Logo area
  if (profile?.orgLogo) {
    try {
      // Detect format from data URL prefix (data:image/jpeg or data:image/png)
      const format = profile.orgLogo.startsWith("data:image/png") ? "PNG" : "JPEG";
      doc.addImage(profile.orgLogo, format, logoX, logoY, logoW, logoH);
    } catch {
      // If image fails to load, draw placeholder
      drawLogoPlaceholder(doc, logoX, logoY, logoW, logoH);
    }
  } else {
    drawLogoPlaceholder(doc, logoX, logoY, logoW, logoH);
  }

  // Organization info (right of logo)
  const orgX = logoX + logoW + 5;
  const orgName = profile?.orgName || "Your Organization";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(25, 25, 25);
  doc.text(orgName, orgX, logoY + 7);

  // Address block
  const addressParts: string[] = [];
  if (profile?.orgAddress) {
    profile.orgAddress.split("\n").slice(0, 3).forEach(l => addressParts.push(l.trim()));
  } else {
    addressParts.push("Address not set — configure in Settings");
  }
  if (profile?.orgPhone) addressParts.push(`Mb. : ${profile.orgPhone}`);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(addressParts, orgX, logoY + 13, { lineHeightFactor: 1.5 });

  // Contact line (email, gstin, website)
  const contactParts: string[] = [];
  if (profile?.orgEmail) contactParts.push(profile.orgEmail);
  if (profile?.orgGstin) contactParts.push(`GSTIN: ${profile.orgGstin}`);
  if (profile?.orgWebsite) contactParts.push(profile.orgWebsite);
  if (contactParts.length > 0) {
    const contactY = logoY + 13 + addressParts.length * 4;
    doc.text(contactParts.join("  |  "), orgX, contactY);
  }

  // "TAX INVOICE" title — large, right-aligned
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(20, 20, 20);
  doc.text("TAX INVOICE", COL.right - 2, logoY + 22, { align: "right" });

  // Separator line below header
  const sepY = logoY + logoH + 5;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, sepY, COL.right, sepY);

  return sepY;
}

// Draw a simple placeholder when no logo is uploaded
function drawLogoPlaceholder(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(x, y, w, h);
  // Circle
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(1.2);
  doc.circle(x + w / 2, y + h / 2 - 2, 10);
  // Hammer cross lines
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(1.5);
  doc.line(x + 8, y + h / 2 + 4, x + w - 8, y + h / 2 - 10);
  doc.setDrawColor(220, 38, 38);
  doc.line(x + w - 8, y + h / 2 + 4, x + 8, y + h / 2 - 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);
  doc.text("Add logo", x + w / 2, y + h - 3, { align: "center" });
}

// ------------------------------------------------------------
// Draw invoice metadata section (Invoice #, Date, Terms, Due Date)
// Returns Y after the section's bottom border
// ------------------------------------------------------------
function drawMetadata(doc: jsPDF, invoice: InvoiceData, yStart: number): number {
  const leftColX = MARGIN + 2;
  const valueX = 55;
  const midLine = MARGIN + CONTENT_W / 2;   // vertical divider at 105mm
  let y = yStart + 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);

  // Row 1: # (invoice number)
  doc.setFont("helvetica", "bold");
  doc.text("#", leftColX, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text(`: ${invoice.invoiceNumber}`, valueX, y);

  // Row 2: Invoice Date
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text("Invoice Date", leftColX, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text(`: ${formatDate(invoice.date)}`, valueX, y);

  // Row 3: Terms (if present)
  if (invoice.terms) {
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text("Terms", leftColX, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text(`: ${sanitize(invoice.terms)}`, valueX, y);
  }

  // Row 4: Due Date (if present)
  if (invoice.dueDate) {
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text("Due Date", leftColX, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text(`: ${formatDate(invoice.dueDate)}`, valueX, y);
  }

  // Vertical mid divider
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(midLine, yStart, midLine, y + 5);

  // Bottom border of metadata section
  const bottomY = y + 5;
  doc.line(MARGIN, bottomY, COL.right, bottomY);

  return bottomY;
}

// ------------------------------------------------------------
// Draw "Bill To" section
// Returns Y after the section bottom border
// ------------------------------------------------------------
function drawBillTo(doc: jsPDF, invoice: InvoiceData, yStart: number): number {
  let y = yStart + 5;

  // "Bill To" label row
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(25, 25, 25);
  doc.text("Bill To :", MARGIN + 2, y);

  // Thin line under label
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y + 2, COL.right, y + 2);

  y += 7;

  // Client name (bold)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  doc.text(sanitize(invoice.clientName), MARGIN + 2, y);

  // Client address (normal, multi-line)
  if (invoice.address) {
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    const addressLines = sanitize(invoice.address).split("\n");
    doc.text(addressLines, MARGIN + 2, y, { lineHeightFactor: 1.5 });
    y += (addressLines.length - 1) * 4;
  }

  y += 6;
  doc.setDrawColor(200, 200, 200);
  doc.line(MARGIN, y, COL.right, y);

  return y;
}

// ------------------------------------------------------------
// Draw "Subject" section
// Returns Y after the section bottom border
// ------------------------------------------------------------
function drawSubject(doc: jsPDF, invoice: InvoiceData, yStart: number): number {
  let y = yStart + 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(25, 25, 25);
  doc.text("Subject :", MARGIN + 2, y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(70, 70, 70);
  doc.text(sanitize(invoice.subject || "N/A"), MARGIN + 24, y);

  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, COL.right, y);

  return y;
}

// ------------------------------------------------------------
// Draw the table header row
// Returns Y after the header bottom line
// ------------------------------------------------------------
function drawTableHeader(doc: jsPDF, yStart: number): number {
  const y = yStart + HEADER_H - 1;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(25, 25, 25);

  doc.text("#", COL.num, y, { align: "center" });
  doc.text("Item & Description", COL.descStart, y);
  doc.text("Qty", COL.qtyCenter, y, { align: "center" });
  doc.text("Rate", COL.rateCenter, y, { align: "center" });
  doc.text("Amount", COL.amountRight, y, { align: "right" });

  const bottomY = yStart + HEADER_H;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, bottomY, COL.right, bottomY);

  return bottomY;
}

// Draw table vertical column separator lines between two Y positions
function drawTableColumnLines(doc: jsPDF, yTop: number, yBottom: number) {
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(22, yTop, 22, yBottom);    // # | Description
  doc.line(122, yTop, 122, yBottom);  // Description | Qty
  doc.line(143, yTop, 143, yBottom);  // Qty | Rate
  doc.line(164, yTop, 164, yBottom);  // Rate | Amount
}

// ------------------------------------------------------------
// Draw a single item row
// Supports multi-line descriptions (wraps within column width)
// Returns Y after the row's bottom line
// ------------------------------------------------------------
function drawItemRow(
  doc: jsPDF,
  item: InvoiceItem,
  rowIndex: number,
  yStart: number
): number {
  // Split description into lines that fit within the description column (~95mm wide)
  const descLines = item.description
    ? doc.splitTextToSize(sanitize(item.description), 95)
    : [""];

  const rowHeight = Math.max(ROW_H, descLines.length * 4.5 + 3);
  const textY = yStart + rowHeight / 2 + 1.5;

  // Row index number
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(String(rowIndex + 1), COL.num, textY, { align: "center" });

  // Description (may be multi-line)
  doc.setTextColor(40, 40, 40);
  const descStartY = yStart + 4;
  doc.text(descLines, COL.descStart, descStartY, { lineHeightFactor: 1.4 });

  // Qty, Rate, Amount — right-aligned in their columns
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.text(
    new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(item.quantity),
    COL.qtyCenter,
    textY,
    { align: "center" }
  );
  doc.text(
    new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(item.rate),
    COL.rateCenter,
    textY,
    { align: "center" }
  );
  doc.setFont("helvetica", "normal");
  doc.text(
    new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(item.amount),
    COL.amountRight,
    textY,
    { align: "right" }
  );

  // Bottom border of this row
  const bottomY = yStart + rowHeight;
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, bottomY, COL.right, bottomY);

  return bottomY;
}

// ------------------------------------------------------------
// Draw the totals + notes + signature section
// Placed at yStart, fills down to page bottom
// ------------------------------------------------------------
function drawTotalsSection(
  doc: jsPDF,
  invoice: InvoiceData,
  yStart: number
) {
  const advance = invoice.advance ?? 0;
  const balanceDue = invoice.total - advance;

  // Outer box around this whole section
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);

  const midX = 120;  // vertical split between words/notes and totals

  // Vertical line splitting left notes panel from right totals panel
  doc.line(midX, yStart, midX, PAGE_BOTTOM);

  // ---- Left panel: Total in Words + Notes ----
  let ly = yStart + 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  doc.text("Total In Words", MARGIN + 2, ly);

  ly += 5;
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(8);
  doc.setTextColor(25, 25, 25);
  const wordsLines = doc.splitTextToSize(
    sanitize(invoice.totalInWords || "N/A"),
    midX - MARGIN - 4
  );
  doc.text(wordsLines, MARGIN + 2, ly);
  ly += wordsLines.length * 4 + 2;

  // Notes divider
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, ly + 2, midX, ly + 2);
  ly += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(35, 35, 35);
  doc.text("Notes", MARGIN + 2, ly);
  ly += 5;

  const defaultNotes =
    invoice.notes ||
    "Debris carting away outside extra charge.\nAny re work / plan change charges extra.\nWater, electricity at site provided by client.\n50% advance payment.";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  const notesLines = doc.splitTextToSize(
    sanitize(defaultNotes),
    midX - MARGIN - 4
  );
  doc.text(notesLines, MARGIN + 2, ly);

  // ---- Right panel: Sub Total, Advance, Total, Balance Due ----
  const rLabelX = midX + 5;
  const rValueX = COL.right - 3;
  let ry = yStart + 6;

  // Sub Total row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Sub Total", rLabelX, ry);
  doc.setTextColor(30, 30, 30);
  doc.text(fmtCurrency(invoice.subtotal), rValueX, ry, { align: "right" });

  // Divider
  ry += 2;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(midX, ry, COL.right, ry);
  ry += 5;

  // Advance row (only if advance > 0)
  if (advance > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Advance", rLabelX, ry);
    doc.setTextColor(180, 30, 30);
    doc.text(`(-) ${fmtCurrency(advance)}`, rValueX, ry, { align: "right" });

    ry += 2;
    doc.setDrawColor(220, 220, 220);
    doc.line(midX, ry, COL.right, ry);
    ry += 5;
  }

  // Total row (bold)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(25, 25, 25);
  doc.text("Total", rLabelX, ry);
  doc.text(fmtCurrency(invoice.total), rValueX, ry, { align: "right" });

  ry += 2;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(midX, ry, COL.right, ry);
  ry += 5;

  // Balance Due row (bold, prominent)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 15, 15);
  doc.text("Balance Due", rLabelX, ry);
  doc.text(fmtCurrency(balanceDue), rValueX, ry, { align: "right" });

  ry += 2;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.4);
  doc.line(midX, ry, COL.right, ry);

  // ---- Authorized Signature block ----
  const sigLineY = PAGE_BOTTOM - 10;
  const sigTextY = PAGE_BOTTOM - 5;
  const sigLineLeft = midX + 10;
  const sigLineRight = COL.right - 5;

  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.4);
  doc.line(sigLineLeft, sigLineY, sigLineRight, sigLineY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text(
    "Authorized Signature",
    (sigLineLeft + sigLineRight) / 2,
    sigTextY,
    { align: "center" }
  );
}

// ------------------------------------------------------------
// Add page number footer to all pages
// ------------------------------------------------------------
function addPageNumbers(doc: jsPDF) {
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(String(p), COL.right - 2, PAGE_H - MARGIN - 2, { align: "right" });
  }
}

// ------------------------------------------------------------
// Main Export — generateInvoicePDF
// Entry point called from InvoicePreview and InvoiceTable
// ------------------------------------------------------------
export function generateInvoicePDF(
  invoice: InvoiceData,
  items: InvoiceItem[],
  profile?: BusinessProfile | null
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  doc.setFont("helvetica");

  // ---- Page 1 ----
  drawPageBorder(doc);

  // Header
  let y = drawHeader(doc, profile);

  // Metadata (Invoice #, Date, Terms, Due Date)
  y = drawMetadata(doc, invoice, y);

  // Bill To
  y = drawBillTo(doc, invoice, y);

  // Subject
  y = drawSubject(doc, invoice, y);

  // Table header
  const tableTopY = y;  // remember where table starts for column lines
  y = drawTableHeader(doc, y);

  // Track column lines per-page
  let columnLineStartY = tableTopY;

  // ---- Item rows (dynamic, multi-page) ----
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Compute row height for this item (multi-line descriptions)
    const descLines = item.description
      ? doc.splitTextToSize(sanitize(item.description), 95)
      : [""];
    const thisRowH = Math.max(ROW_H, descLines.length * 4.5 + 3);

    // Check if this row + minimum totals section (~60mm) fits on current page
    if (y + thisRowH > PAGE_BOTTOM - 60) {
      // Close column lines on this page
      drawTableColumnLines(doc, columnLineStartY, y);

      // New page
      doc.addPage();
      drawPageBorder(doc);

      // Repeat table header on new page
      y = MARGIN + 5;
      columnLineStartY = y;
      y = drawTableHeader(doc, y);
    }

    y = drawItemRow(doc, item, i, y);
  }

  // Close column lines on last page
  drawTableColumnLines(doc, columnLineStartY, y);

  // ---- Totals section ----
  // Needs ~65mm — if not enough room on current page, start a new page
  if (y + 65 > PAGE_BOTTOM) {
    doc.addPage();
    drawPageBorder(doc);
    y = MARGIN + 5;
  }

  drawTotalsSection(doc, invoice, y);

  // ---- Page numbers ----
  addPageNumbers(doc);

  // ---- Save ----
  doc.save(`${invoice.invoiceNumber}.pdf`);
}
