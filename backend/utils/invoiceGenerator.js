const PDFDocument = require("pdfkit");

/**
 * Compiles a premium, industry-standard corporate invoice binary stream.
 * @param {Object} res - Express response stream packet handle
 * @param {Object} invoice - Parent invoice metadata row from Postgres
 * @param {Array} invoiceItems - Array of child statement line records
 */
function generateInvoicePdfStream(res, invoice, invoiceItems) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=STATEMENT-${invoice.invoice_number}.pdf`,
  );
  doc.pipe(res);

  const dollarFormat = (cents) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);

  // 🎨 BRAND DESIGN DESIGN TOKENS
  const COLOR_PRIMARY = "#18181b";
  const COLOR_SECONDARY = "#52525b";
  const COLOR_ACCENT = "#2563eb";
  const COLOR_MUTED_BG = "#fafafa";

  // --- 🧭 STAGE A: LOGO & LOGISTICS HEADER ---
  let headerY = doc.y;
  doc
    .fillColor(COLOR_PRIMARY)
    .fontSize(22)
    .font("Helvetica-Bold")
    .text("INVOICE STATEMENT", 50, headerY);

  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor(COLOR_SECONDARY)
    .text(`SERIAL ID: `, 50, headerY + 26)
    .font("Courier-Bold")
    .fillColor(COLOR_PRIMARY)
    .text(invoice.invoice_number, 102, headerY + 26);

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLOR_PRIMARY)
    .text("LedgerFlow Workspace Engine", 345, headerY, {
      align: "right",
      width: 200,
    });
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLOR_SECONDARY)
    .text("sandbox.services@ledgerflow.com", 345, headerY + 16, {
      align: "right",
      width: 200,
    });

  doc.moveDown(2.5);

  // --- 👥 STAGE B: CLIENT ROSTER META DETAILS ---
  let rosterY = doc.y;
  doc
    .fillColor(COLOR_SECONDARY)
    .fontSize(8)
    .font("Helvetica-Bold")
    .text("PREPARED FOR / TARGET:", 50, rosterY, { tracking: 1 });
  doc
    .fillColor(COLOR_PRIMARY)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text(invoice.client_name, 50, rosterY + 12)
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLOR_SECONDARY)
    .text("Multi-Tenant Sandbox Enterprise Client Account", 50, rosterY + 26, {
      width: 200,
    });

  let metaX = 380;
  doc
    .fillColor(COLOR_SECONDARY)
    .fontSize(8)
    .font("Helvetica-Bold")
    .text("TRANSACTION TIMELINE PARAMETERS:", metaX, rosterY, { tracking: 1 });

  doc
    .fontSize(9)
    .font("Helvetica")
    .text("Maturity Issue Date:", metaX, rosterY + 14)
    .text("Settlement Status:", metaX, rosterY + 26);

  doc
    .font("Helvetica-Bold")
    .fillColor(COLOR_PRIMARY)
    .text(
      new Date(invoice.due_date).toLocaleDateString(),
      metaX + 95,
      rosterY + 14,
      { align: "right", width: 70 },
    )
    .fillColor(invoice.status === "paid" ? "#16a34a" : "#ca8a04")
    .text(invoice.status.toUpperCase(), metaX + 95, rosterY + 26, {
      align: "right",
      width: 70,
    });

  doc.moveDown(4.5);

  // --- ⚡ STAGE C: ITEMIZATION LEDGER GRID ---
  let tableY = doc.y;
  doc
    .fillColor(COLOR_PRIMARY)
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("LINE ACCOUNT ENTRY SPECIFICATIONS", 50, tableY);

  doc.moveDown(0.6);
  let currentY = doc.y;

  doc.fontSize(8).font("Helvetica-Bold").fillColor(COLOR_SECONDARY);
  doc.text("Description/Line Items Allocation Summary", 55, currentY, {
    width: 260,
  });
  doc.text("Quantity", 330, currentY, { width: 45, align: "right" });
  doc.text("Unit Base Rate", 395, currentY, { width: 65, align: "right" });
  doc.text("Segment Valuation", 475, currentY, { width: 70, align: "right" });

  doc.moveDown(0.5);
  doc
    .strokeColor("#e4e4e7")
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();
  doc.moveDown(0.4);

  doc.font("Helvetica").fontSize(9).fillColor(COLOR_PRIMARY);

  let rowIndex = 0;
  for (const item of invoiceItems) {
    currentY = doc.y;
    const lineTotalCents = item.quantity * item.unit_amount_cents;

    if (rowIndex % 2 === 1) {
      doc
        .save()
        .fillColor(COLOR_MUTED_BG)
        .rect(50, currentY - 4, 495, 18)
        .fill()
        .restore();
    }

    doc
      .fillColor(COLOR_PRIMARY)
      .text(item.description, 55, currentY, {
        width: 260,
        height: 12,
        ellipsis: true,
      });
    doc.text(item.quantity.toString(), 330, currentY, {
      width: 45,
      align: "right",
    });
    doc.text(dollarFormat(item.unit_amount_cents), 395, currentY, {
      width: 65,
      align: "right",
    });
    doc.text(dollarFormat(lineTotalCents), 475, currentY, {
      width: 70,
      align: "right",
    });

    doc.moveDown(1.1);
    rowIndex++;
  }

  doc
    .strokeColor("#e4e4e7")
    .lineWidth(0.5)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();
  doc.moveDown(1.5);

  // --- 📊 STAGE D: SUM PANEL ---
  let totalBlockY = doc.y;
  doc
    .save()
    .fillColor(COLOR_MUTED_BG)
    .rect(345, totalBlockY, 200, 36)
    .fill()
    .strokeColor("#e4e4e7")
    .lineWidth(1)
    .rect(345, totalBlockY, 200, 36)
    .stroke()
    .restore();
  doc
    .fillColor(COLOR_SECONDARY)
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("TOTAL AGGREGATE BALANCE:", 360, totalBlockY + 14);
  doc
    .fillColor(COLOR_PRIMARY)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text(dollarFormat(invoice.total_amount_cents), 440, totalBlockY + 13, {
      align: "right",
      width: 90,
    });

  // --- 🚀 STAGE E: LEDGERFLOW PROMO FOOTER HERO ---
  doc.text("", 50, 715);
  doc
    .save()
    .fillColor("#09090b")
    .roundedRect(50, doc.y, 495, 48, 6)
    .fill()
    .restore();

  let promoY = doc.y + 14;
  doc
    .fillColor("#ffffff")
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("Invoices managed effortlessly via LedgerFlow//", 68, promoY);
  doc
    .fillColor("#a1a1aa")
    .fontSize(8.5)
    .font("Helvetica")
    .text(
      "Want to automate your freelance operations hands-free? Scan to connect at ledgerflow.studio",
      68,
      promoY + 13,
    );
  doc
    .fillColor(COLOR_ACCENT)
    .circle(515, promoY + 10, 3)
    .fill();

  doc.end();
}

module.exports = { generateInvoicePdfStream };
