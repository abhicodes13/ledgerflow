const PDFDocument = require("pdfkit");

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const COLORS = {
  text: "#111827",
  muted: "#6b7280",
  line: "#e5e7eb",
  band: "#f3f4f6",
  accent: "#1d4ed8",
  paid: "#15803d",
  due: "#b45309",
  overdue: "#b91c1c",
  void: "#6b7280",
};

const LEFT = 50; // left margin
const RIGHT = 545; // right edge of content (A4 width 595 - 50)
const CONTENT_W = RIGHT - LEFT;
const FOOTER_RESERVE = 90; // space kept free at the bottom of each page

// ---------------------------------------------------------------------------
// Date helpers
// Works whether pg returns a DATE as a "YYYY-MM-DD" string or as a JS Date,
// and never shifts the day because of time zones.
// ---------------------------------------------------------------------------
function toYmd(value) {
  if (!value) return null;
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(value).slice(0, 10);
}

function formatDate(value) {
  const ymd = toYmd(value);
  if (!ymd) return "-";
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// "Overdue" is computed, never stored: unpaid and past the due date.
function getStatus(invoice) {
  if (invoice.status === "paid") return { label: "PAID", color: COLORS.paid };
  if (invoice.status === "void") return { label: "VOID", color: COLORS.void };
  const due = toYmd(invoice.due_date);
  if (due && due < toYmd(new Date())) {
    return { label: "OVERDUE", color: COLORS.overdue };
  }
  return { label: "DUE", color: COLORS.due };
}

/**
 * Streams a professional invoice PDF to the response.
 *
 * @param {Object} res           Express response
 * @param {Object} invoice       invoices row + client_name, client_email, (optional) client_phone, notes
 * @param {Array}  invoiceItems  rows with description, quantity, unit_amount_cents
 * @param {Object} business      optional sender info: { name, email, phone, address, paymentInstructions }
 * @param {Object} options       optional: { currency: "USD", showBranding: true }
 */
function generateInvoicePdfStream(
  res,
  invoice,
  invoiceItems,
  business = {},
  options = {},
) {
  const currency = options.currency || "USD";
  const money = (cents) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
      (cents || 0) / 100,
    );

  const safeNumber = String(invoice.invoice_number).replace(/[^\w.-]/g, "_");
  const status = getStatus(invoice);
  const isPaid = invoice.status === "paid";

  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
    bufferPages: true, // lets us stamp "Page X of Y" at the end
    info: {
      Title: `Invoice ${invoice.invoice_number}`,
      Author: business.name || "LedgerFlow",
    },
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="Invoice-${safeNumber}.pdf"`,
  );
  doc.pipe(res);

  const pageBottom = () => doc.page.height - FOOTER_RESERVE;

  // -------------------------------------------------------------------------
  // 1. Header: sender on the left, INVOICE title + status badge on the right
  // -------------------------------------------------------------------------
  let y = 50;

  const senderName = business.name || business.email || "Your Business";
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(COLORS.text)
    .text(senderName, LEFT, y, { width: 280 });

  let senderY = doc.y + 2;
  const senderLines = [
    business.name ? business.email : null,
    business.phone,
    ...(business.address ? String(business.address).split("\n") : []),
  ].filter(Boolean);

  doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted);
  for (const line of senderLines) {
    doc.text(line, LEFT, senderY, { width: 280 });
    senderY = doc.y;
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(26)
    .fillColor(COLORS.accent)
    .text("INVOICE", 345, y, { width: 200, align: "right" });
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(COLORS.muted)
    .text(`# ${invoice.invoice_number}`, 345, y + 32, {
      width: 200,
      align: "right",
    });

  const badgeW = 74;
  const badgeX = RIGHT - badgeW;
  const badgeY = y + 52;
  doc.roundedRect(badgeX, badgeY, badgeW, 18, 4).fill(status.color);
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#ffffff")
    .text(status.label, badgeX, badgeY + 5, { width: badgeW, align: "center" });

  y = Math.max(senderY, badgeY + 18) + 24;
  doc
    .moveTo(LEFT, y)
    .lineTo(RIGHT, y)
    .lineWidth(1)
    .strokeColor(COLORS.line)
    .stroke();

  // -------------------------------------------------------------------------
  // 2. Bill-to (left) and dates (right)
  // -------------------------------------------------------------------------
  const infoY = y + 16;

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text("BILL TO", LEFT, infoY);
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.text)
    .text(invoice.client_name || "-", LEFT, infoY + 14, { width: 260 });

  let billY = doc.y + 2;
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted);
  for (const line of [invoice.client_email, invoice.client_phone].filter(
    Boolean,
  )) {
    doc.text(line, LEFT, billY, { width: 260 });
    billY = doc.y;
  }

  const meta = [
    ["Issue date", formatDate(invoice.created_at)],
    ["Due date", formatDate(invoice.due_date)],
  ];
  if (isPaid && invoice.paid_at)
    meta.push(["Paid on", formatDate(invoice.paid_at)]);

  let metaY = infoY;
  for (const [label, value] of meta) {
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text(label, 345, metaY, { width: 90 });
    doc
      .font("Helvetica-Bold")
      .fillColor(COLORS.text)
      .text(value, 435, metaY, { width: 110, align: "right" });
    metaY += 16;
  }

  y = Math.max(billY, metaY) + 28;

  // -------------------------------------------------------------------------
  // 3. Line items table (repeats its header on new pages)
  // -------------------------------------------------------------------------
  const col = {
    desc: { x: 56, w: 250 },
    qty: { x: 310, w: 40 },
    unit: { x: 355, w: 85 },
    amt: { x: 445, w: 94 },
  };

  const drawTableHeader = (top) => {
    doc.rect(LEFT, top, CONTENT_W, 22).fill(COLORS.band);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.muted);
    doc.text("DESCRIPTION", col.desc.x, top + 7, { width: col.desc.w });
    doc.text("QTY", col.qty.x, top + 7, { width: col.qty.w, align: "right" });
    doc.text("UNIT PRICE", col.unit.x, top + 7, {
      width: col.unit.w,
      align: "right",
    });
    doc.text("AMOUNT", col.amt.x, top + 7, {
      width: col.amt.w,
      align: "right",
    });
    return top + 22;
  };

  y = drawTableHeader(y);

  let subtotal = 0;
  for (const item of invoiceItems) {
    const description = String(item.description || "");
    const lineTotal = item.quantity * item.unit_amount_cents;
    subtotal += lineTotal;

    doc.font("Helvetica").fontSize(10);
    const textHeight = doc.heightOfString(description, { width: col.desc.w });
    const rowHeight = Math.max(textHeight, 12) + 16;

    if (y + rowHeight > pageBottom()) {
      doc.addPage();
      y = drawTableHeader(50);
    }

    doc.font("Helvetica").fontSize(10).fillColor(COLORS.text);
    doc.text(description, col.desc.x, y + 8, { width: col.desc.w });
    doc.text(String(item.quantity), col.qty.x, y + 8, {
      width: col.qty.w,
      align: "right",
    });
    doc.text(money(item.unit_amount_cents), col.unit.x, y + 8, {
      width: col.unit.w,
      align: "right",
    });
    doc.text(money(lineTotal), col.amt.x, y + 8, {
      width: col.amt.w,
      align: "right",
    });

    y += rowHeight;
    doc
      .moveTo(LEFT, y)
      .lineTo(RIGHT, y)
      .lineWidth(0.5)
      .strokeColor(COLORS.line)
      .stroke();
  }

  // -------------------------------------------------------------------------
  // 4. Totals
  // -------------------------------------------------------------------------
  y += 18;
  if (y + 90 > pageBottom()) {
    doc.addPage();
    y = 50;
  }

  const totalsRow = (
    label,
    value,
    { bold = false, color = COLORS.text } = {},
  ) => {
    doc
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(10)
      .fillColor(color);
    doc.text(label, 345, y, { width: 100 });
    doc.text(value, 445, y, { width: 94, align: "right" });
    y += 18;
  };

  totalsRow("Subtotal", money(subtotal), { color: COLORS.muted });
  totalsRow("Total", money(subtotal), { bold: true });

  const amountDue = isPaid || invoice.status === "void" ? 0 : subtotal;
  y += 4;
  doc.rect(345, y, 200, 32).fill(COLORS.band);
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.text)
    .text("Amount due", 355, y + 11, { width: 90 });
  doc
    .fontSize(14)
    .fillColor(COLORS.accent)
    .text(money(amountDue), 445, y + 9, { width: 94, align: "right" });
  y += 32 + 28;

  // -------------------------------------------------------------------------
  // 5. Payment instructions / notes
  // -------------------------------------------------------------------------
  const sections = [];
  if (business.paymentInstructions) {
    sections.push([
      "PAYMENT INSTRUCTIONS",
      String(business.paymentInstructions),
    ]);
  }
  if (invoice.notes) sections.push(["NOTES", String(invoice.notes)]);
  if (!sections.length) {
    sections.push(
      isPaid
        ? ["THANK YOU", "Payment received. Thank you for your business."]
        : [
            "PAYMENT",
            `Please include invoice number ${invoice.invoice_number} with your payment.`,
          ],
    );
  }

  for (const [label, body] of sections) {
    doc.font("Helvetica").fontSize(9);
    const needed = doc.heightOfString(body, { width: CONTENT_W }) + 24;
    if (y + needed > pageBottom()) {
      doc.addPage();
      y = 50;
    }
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(label, LEFT, y);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(COLORS.text)
      .text(body, LEFT, y + 13, { width: CONTENT_W });
    y = doc.y + 18;
  }

  // -------------------------------------------------------------------------
  // 6. Footer on every page: reference + "Page X of Y"
  // -------------------------------------------------------------------------
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);

    // Writing below the bottom margin would make pdfkit add a blank page,
    // so the margin is set to 0 just while the footer is drawn.
    const savedBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    const footerY = doc.page.height - 55;
    doc
      .moveTo(LEFT, footerY)
      .lineTo(RIGHT, footerY)
      .lineWidth(0.5)
      .strokeColor(COLORS.line)
      .stroke();

    doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted);
    doc.text(
      `Invoice ${invoice.invoice_number}${business.name ? "  |  " + business.name : ""}`,
      LEFT,
      footerY + 10,
      { width: 330 },
    );
    doc.text(`Page ${i + 1} of ${range.count}`, 445, footerY + 10, {
      width: 100,
      align: "right",
    });
    if (options.showBranding !== false) {
      doc.text("Created with LedgerFlow", LEFT, footerY + 22, { width: 330 });
    }

    doc.page.margins.bottom = savedBottom;
  }

  doc.end();
}

module.exports = { generateInvoicePdfStream };
