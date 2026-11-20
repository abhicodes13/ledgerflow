const PDFDocument = require("pdfkit");

// =========================================================================
// INVOICE PDF
//
// US Letter, one accent colour, lots of white space. Layout, top to bottom:
//   1. accent bar + header: sender on the left, INVOICE / number / status pill on the right
//   2. info row: Billed to | Dates | Amount-due panel (with the Pay online button)
//   3. line items table (header repeats on every page)
//   4. totals on the right, payment / notes cards on the left
//   5. footer on every page
//
// Same signature as before, so nothing else in the app changes:
//   generateInvoicePdfStream(res, invoice, invoiceItems, business, options)
// =========================================================================

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const PAGE = { size: "LETTER", width: 612, height: 792, margin: 48 };
const LEFT = PAGE.margin;
const RIGHT = PAGE.width - PAGE.margin;
const FOOTER_RESERVE = 84; // space kept free at the bottom of each page

const COLORS = {
  ink: "#0f172a",
  text: "#1f2937",
  muted: "#6b7280",
  subtle: "#9ca3af",
  line: "#e5e7eb",
  lineStrong: "#cbd5e1",
  card: "#f8fafc",
  accent: "#1d4ed8",
  white: "#ffffff",
};

// Status look: pill colours, and the colours of the amount panel
const STATUS = {
  paid: {
    label: "PAID",
    fg: "#15803d",
    bg: "#dcfce7",
    panelBg: "#f0fdf4",
    panelEdge: "#bbf7d0",
    panelFg: "#15803d",
  },
  void: {
    label: "VOID",
    fg: "#6b7280",
    bg: "#f3f4f6",
    panelBg: "#f8fafc",
    panelEdge: "#e5e7eb",
    panelFg: "#6b7280",
  },
  overdue: {
    label: "OVERDUE",
    fg: "#b91c1c",
    bg: "#fee2e2",
    panelBg: "#fef2f2",
    panelEdge: "#fecaca",
    panelFg: "#b91c1c",
  },
  due: {
    label: "DUE",
    fg: "#b45309",
    bg: "#fef3c7",
    panelBg: "#eff6ff",
    panelEdge: "#bfdbfe",
    panelFg: COLORS.accent,
  },
};

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
  if (invoice.status === "paid") return STATUS.paid;
  if (invoice.status === "void") return STATUS.void;
  const due = toYmd(invoice.due_date);
  if (due && due < toYmd(new Date())) return STATUS.overdue;
  return STATUS.due;
}

// Only https links go into a PDF. (Plain http is allowed for localhost while
// developing, so the button can be tested on your own machine.)
function safePayUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(String(value));
    if (url.protocol === "https:") return url.toString();
    const local = ["localhost", "127.0.0.1"].includes(url.hostname);
    if (
      url.protocol === "http:" &&
      local &&
      process.env.NODE_ENV !== "production"
    ) {
      return url.toString();
    }
    return null;
  } catch {
    return null;
  }
}

// Largest font size (down to minSize) at which the text still fits the width
function fitFontSize(doc, text, font, maxSize, minSize, maxWidth) {
  let size = maxSize;
  doc.font(font);
  while (size > minSize) {
    doc.fontSize(size);
    if (doc.widthOfString(text) <= maxWidth) break;
    size -= 1;
  }
  return size;
}

// One line of text that must fit a width: shrinks the font a little (down to
// minSize), and only if it still does not fit, cuts it and adds an ellipsis.
// Used for emails, phone numbers and addresses, which cannot wrap nicely.
function fitText(doc, text, font, size, minSize, maxWidth) {
  const full = String(text);
  doc.font(font);
  let fontSize = size;
  while (fontSize >= minSize) {
    doc.fontSize(fontSize);
    if (doc.widthOfString(full) <= maxWidth)
      return { text: full, size: fontSize };
    fontSize -= 0.5;
  }
  doc.fontSize(minSize);
  let cut = full;
  while (cut.length > 1 && doc.widthOfString(cut + "\u2026") > maxWidth)
    cut = cut.slice(0, -1);
  return { text: cut + "\u2026", size: minSize };
}

/**
 * Streams a professional invoice PDF to the response.
 *
 * @param {Object} res           Express response
 * @param {Object} invoice       invoices row + client_name, client_email, (optional) client_phone, notes
 * @param {Array}  invoiceItems  rows with description, quantity, unit_amount_cents
 * @param {Object} business      optional sender info: { name, email, phone, address, paymentInstructions }
 * @param {Object} options       optional: { currency: "USD", showBranding: true, paymentUrl }
 *                               paymentUrl adds a clickable "Pay online" button. It only
 *                               appears on unpaid, non-void invoices.
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
  const isVoid = invoice.status === "void";
  const payUrl = !isPaid && !isVoid ? safePayUrl(options.paymentUrl) : null;

  const subtotal = invoiceItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_amount_cents,
    0,
  );
  const amountDue = isPaid || isVoid ? 0 : subtotal;

  const doc = new PDFDocument({
    size: PAGE.size,
    margin: PAGE.margin,
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
  const smallLabel = (text, x, y) =>
    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(COLORS.muted)
      .text(String(text).toUpperCase(), x, y, { characterSpacing: 0.8 });

  // -------------------------------------------------------------------------
  // 1. Accent bar and header
  // -------------------------------------------------------------------------
  doc.rect(0, 0, PAGE.width, 6).fill(COLORS.accent);

  // Faint watermark for paid and void invoices, drawn first so text sits on top
  if (isPaid || isVoid) {
    doc.save();
    doc.rotate(-22, { origin: [PAGE.width / 2, 430] });
    doc
      .fillOpacity(0.07)
      .font("Helvetica-Bold")
      .fontSize(130)
      .fillColor(status.fg)
      .text(status.label, 0, 370, {
        width: PAGE.width,
        align: "center",
        lineBreak: false,
      });
    doc.restore();
  }

  let y = 40;

  // Left: who is sending the invoice
  const senderName = business.name || business.email || "Your Business";
  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor(COLORS.ink)
    .text(senderName, LEFT, y, { width: 300 });

  let senderY = doc.y + 3;
  const senderLines = [
    business.name ? business.email : null,
    business.phone,
    ...(business.address ? String(business.address).split("\n") : []),
  ].filter(Boolean);

  for (const line of senderLines) {
    const fit = fitText(doc, line, "Helvetica", 9, 7, 300);
    doc
      .font("Helvetica")
      .fontSize(fit.size)
      .fillColor(COLORS.muted)
      .text(fit.text, LEFT, senderY + 1, { width: 300, lineBreak: false });
    senderY = doc.y;
  }

  // Right: INVOICE label, number, status pill
  const rightW = 230;
  const rightX = RIGHT - rightW;
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.accent)
    .text("INVOICE", rightX, y + 2, {
      width: rightW,
      align: "right",
      characterSpacing: 2,
    });

  const numText = String(invoice.invoice_number);
  const numSize = fitFontSize(doc, numText, "Helvetica-Bold", 24, 14, rightW);
  doc
    .font("Helvetica-Bold")
    .fontSize(numSize)
    .fillColor(COLORS.ink)
    .text(numText, rightX, y + 16, { width: rightW, align: "right" });

  doc.font("Helvetica-Bold").fontSize(8);
  const pillW =
    doc.widthOfString(status.label) + status.label.length * 0.6 + 22;
  const pillH = 17;
  const pillX = RIGHT - pillW;
  const pillY = y + 16 + numSize * 1.16 + 8;
  doc.roundedRect(pillX, pillY, pillW, pillH, pillH / 2).fill(status.bg);
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(status.fg)
    .text(status.label, pillX, pillY + 5, {
      width: pillW,
      align: "center",
      characterSpacing: 0.6,
    });

  y = Math.max(senderY, pillY + pillH) + 22;
  doc
    .moveTo(LEFT, y)
    .lineTo(RIGHT, y)
    .lineWidth(0.75)
    .strokeColor(COLORS.line)
    .stroke();

  // -------------------------------------------------------------------------
  // 2. Info row: Billed to | Dates | Amount-due panel
  // -------------------------------------------------------------------------
  const infoY = y + 24;

  // Column 1: billed to
  smallLabel("Billed to", LEFT, infoY);
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.ink)
    .text(invoice.client_name || "-", LEFT, infoY + 14, { width: 185 });
  let billY = doc.y + 3;
  for (const line of [invoice.client_email, invoice.client_phone].filter(
    Boolean,
  )) {
    const fit = fitText(doc, line, "Helvetica", 9, 7, 185);
    doc
      .font("Helvetica")
      .fontSize(fit.size)
      .fillColor(COLORS.muted)
      .text(fit.text, LEFT, billY + 1, { width: 185, lineBreak: false });
    billY = doc.y;
  }

  // Column 2: dates
  const datesX = 248;
  const dates = [
    ["Issue date", formatDate(invoice.created_at)],
    ["Due date", formatDate(invoice.due_date)],
  ];
  if (isPaid && invoice.paid_at)
    dates.push(["Paid on", formatDate(invoice.paid_at)]);
  let dateY = infoY;
  for (const [label, value] of dates) {
    smallLabel(label, datesX, dateY);
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(COLORS.ink)
      .text(value, datesX, dateY + 12, { width: 130 });
    dateY += 34;
  }

  // Column 3: amount panel (with the Pay online button when there is a link)
  const panelX = 392;
  const panelW = RIGHT - panelX;
  const innerW = panelW - 32;
  const panelAmount = money(amountDue);
  const amountSize = fitFontSize(
    doc,
    panelAmount,
    "Helvetica-Bold",
    26,
    15,
    innerW,
  );
  const amountH = amountSize * 1.16;
  const subText = isPaid
    ? "Paid in full"
    : isVoid
      ? "This invoice is void"
      : `Due ${formatDate(invoice.due_date)}`;
  const btnH = 30;
  const panelH = 16 + 10 + 6 + amountH + 6 + 12 + (payUrl ? 14 + btnH : 0) + 16;

  doc
    .roundedRect(panelX, infoY - 6, panelW, panelH, 10)
    .lineWidth(0.75)
    .fillAndStroke(status.panelBg, status.panelEdge);
  let py = infoY - 6 + 16;
  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor(status.panelFg)
    .text("AMOUNT DUE", panelX + 16, py, {
      width: innerW,
      characterSpacing: 0.8,
    });
  py += 10 + 6;
  doc
    .font("Helvetica-Bold")
    .fontSize(amountSize)
    .fillColor(status.panelFg)
    .text(panelAmount, panelX + 16, py, { width: innerW });
  py += amountH + 6;
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(subText, panelX + 16, py, { width: innerW });
  py += 12;

  if (payUrl) {
    // A real link annotation: clicking the button opens the payment page.
    py += 14;
    doc.roundedRect(panelX + 16, py, innerW, btnH, 7).fill(COLORS.accent);
    doc
      .font("Helvetica-Bold")
      .fontSize(10.5)
      .fillColor(COLORS.white)
      .text("Pay online", panelX + 16, py + 9.5, {
        width: innerW,
        align: "center",
      });
    doc.link(panelX + 16, py, innerW, btnH, payUrl);
  }

  y = Math.max(billY, dateY, infoY - 6 + panelH) + 34;

  // -------------------------------------------------------------------------
  // 3. Line items table (the header repeats on new pages)
  // -------------------------------------------------------------------------
  const col = {
    desc: { x: LEFT, w: 270 },
    qty: { x: 330, w: 40 },
    unit: { x: 380, w: 80 },
    amt: { x: 470, w: RIGHT - 470 },
  };

  const drawTableHeader = (top) => {
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(COLORS.muted);
    const opts = { characterSpacing: 0.8 };
    doc.text("DESCRIPTION", col.desc.x, top, { width: col.desc.w, ...opts });
    // 0.8 less width: letter spacing adds a trailing gap that would push the heading off the column edge
    doc.text("QTY", col.qty.x, top, {
      width: col.qty.w - 0.8,
      align: "right",
      ...opts,
    });
    doc.text("UNIT PRICE", col.unit.x, top, {
      width: col.unit.w - 0.8,
      align: "right",
      ...opts,
    });
    doc.text("AMOUNT", col.amt.x, top, {
      width: col.amt.w - 0.8,
      align: "right",
      ...opts,
    });
    const lineY = top + 17;
    doc
      .moveTo(LEFT, lineY)
      .lineTo(RIGHT, lineY)
      .lineWidth(1)
      .strokeColor(COLORS.lineStrong)
      .stroke();
    return lineY;
  };

  y = drawTableHeader(y);

  if (invoiceItems.length === 0) {
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text("No line items", col.desc.x, y + 14, { width: col.desc.w });
    y += 14 + 12 + 14;
  }

  for (const item of invoiceItems) {
    const description = String(item.description || "");
    const lineTotal = item.quantity * item.unit_amount_cents;

    doc.font("Helvetica").fontSize(10);
    const textHeight = doc.heightOfString(description, { width: col.desc.w });
    const rowHeight = Math.max(textHeight, 12) + 26; // 13pt of air above and below

    if (y + rowHeight > pageBottom()) {
      doc.addPage();
      y = drawTableHeader(PAGE.margin);
    }

    doc.font("Helvetica").fontSize(10).fillColor(COLORS.ink);
    doc.text(description, col.desc.x, y + 13, { width: col.desc.w });
    doc.fillColor(COLORS.muted);
    doc.text(String(item.quantity), col.qty.x, y + 13, {
      width: col.qty.w,
      align: "right",
    });
    doc.text(money(item.unit_amount_cents), col.unit.x, y + 13, {
      width: col.unit.w,
      align: "right",
    });
    doc.font("Helvetica-Bold").fillColor(COLORS.ink);
    doc.text(money(lineTotal), col.amt.x, y + 13, {
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
  // 4. Totals (right) and payment / notes cards (left), side by side
  // -------------------------------------------------------------------------
  y += 26;
  const totalsX = 352;
  const totalsW = RIGHT - totalsX;
  const totalsHeight = (isPaid ? 24 : 0) + 24 + 2 + 44;

  if (y + totalsHeight > pageBottom()) {
    doc.addPage();
    y = PAGE.margin;
  }
  const blockTop = y;

  const totalsRow = (
    label,
    value,
    { bold = false, color = COLORS.text } = {},
  ) => {
    doc
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(10)
      .fillColor(color);
    doc.text(label, totalsX, y, { width: 110 });
    doc.text(value, totalsX + 110, y, { width: totalsW - 110, align: "right" });
    y += 24;
  };

  totalsRow("Total", money(subtotal), { bold: true, color: COLORS.ink });
  if (isPaid)
    totalsRow("Paid", `- ${money(subtotal)}`, { color: STATUS.paid.fg });
  y += 2;
  doc
    .roundedRect(totalsX, y, totalsW, 44, 8)
    .lineWidth(0.75)
    .fillAndStroke(status.panelBg, status.panelEdge);
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.ink)
    .text("Amount due", totalsX + 14, y + 17, { width: 90 });
  const dueSize = fitFontSize(
    doc,
    money(amountDue),
    "Helvetica-Bold",
    16,
    11,
    totalsW - 28 - 90,
  );
  doc
    .font("Helvetica-Bold")
    .fontSize(dueSize)
    .fillColor(status.panelFg)
    .text(money(amountDue), totalsX + 104, y + 14 + (16 - dueSize) / 2, {
      width: totalsW - 104 - 14,
      align: "right",
    });
  const totalsBottom = y + 44;

  // Cards on the left, starting at the same height as the totals
  const cards = [];
  if (business.paymentInstructions) {
    cards.push({
      label: "Payment instructions",
      body: String(business.paymentInstructions),
    });
  }
  if (payUrl) {
    cards.push({
      label: "Pay online",
      body: "Use the Pay online button on this invoice, or open this link:",
      link: payUrl,
    });
  }
  if (invoice.notes)
    cards.push({ label: "Notes", body: String(invoice.notes) });
  if (!cards.length) {
    cards.push(
      isPaid
        ? {
            label: "Thank you",
            body: "Payment received. Thank you for your business.",
          }
        : {
            label: "Payment",
            body: `Please include invoice number ${invoice.invoice_number} with your payment.`,
          },
    );
  }

  const cardW = totalsX - LEFT - 28;
  let cy = blockTop;
  for (const card of cards) {
    doc.font("Helvetica").fontSize(9);
    const bodyH = doc.heightOfString(card.body, { width: cardW - 28 });
    doc.fontSize(8);
    const linkH = card.link
      ? doc.heightOfString(card.link, { width: cardW - 28 }) + 4
      : 0;
    const cardH = 14 + 10 + 6 + bodyH + linkH + 14;

    if (cy + cardH > pageBottom()) {
      doc.addPage();
      cy = PAGE.margin;
    }
    doc
      .roundedRect(LEFT, cy, cardW, cardH, 8)
      .lineWidth(0.75)
      .fillAndStroke(COLORS.card, COLORS.line);
    smallLabel(card.label, LEFT + 14, cy + 14);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(COLORS.text)
      .text(card.body, LEFT + 14, cy + 14 + 10 + 6, { width: cardW - 28 });
    if (card.link) {
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.accent)
        .text(card.link, LEFT + 14, doc.y + 4, {
          width: cardW - 28,
          link: card.link,
        });
    }
    cy += cardH + 12;
  }
  y = Math.max(totalsBottom, cy);

  // -------------------------------------------------------------------------
  // 5. Footer on every page: reference, branding, "Page X of Y"
  // -------------------------------------------------------------------------
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);

    // Writing below the bottom margin would make pdfkit add a blank page,
    // so the margin is set to 0 just while the footer is drawn.
    const savedBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    const footerY = doc.page.height - 50;
    doc
      .moveTo(LEFT, footerY)
      .lineTo(RIGHT, footerY)
      .lineWidth(0.5)
      .strokeColor(COLORS.line)
      .stroke();

    doc.font("Helvetica").fontSize(8).fillColor(COLORS.subtle);
    doc.text(
      `Invoice ${invoice.invoice_number}${business.name ? "  \u00b7  " + business.name : ""}`,
      LEFT,
      footerY + 11,
      { width: 330 },
    );
    doc.text(`Page ${i + 1} of ${range.count}`, RIGHT - 100, footerY + 11, {
      width: 100,
      align: "right",
    });
    if (options.showBranding !== false) {
      doc.text("Created with LedgerFlow", LEFT, footerY + 23, { width: 330 });
    }

    doc.page.margins.bottom = savedBottom;
  }

  doc.end();
}

module.exports = { generateInvoicePdfStream };
