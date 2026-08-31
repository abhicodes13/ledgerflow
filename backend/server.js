const express = require("express");
const pool = require("./db");
const clientService = require("./clientService");
const invoiceService = require("./invoiceService"); // 1. Import our new invoice service layer
const analyticsRepository = require("./analyticsRepository");
const PDFDocument = require("pdfkit");
const authService = require("./authService");

const app = express();
const PORT = 3000;

app.use(express.json());

// System Health Check
app.get("/api/health", async (req, res) => {
  try {
    const dbResult = await pool.query("SELECT NOW()");
    res.json({
      status: "healthy",
      message: "Server is running perfectly!",
      database_time: dbResult.rows.now,
    });
  } catch (error) {
    res.status(500).json({ status: "unhealthy", error: error.message });
  }
});

// Client Signup Route
app.post("/api/clients", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res
      .status(400)
      .json({ error: "Name and email are required fields." });
  }
  try {
    const newClient = await clientService.registerClient(name, email);
    return res
      .status(201)
      .json({ message: "Client created successfully", client: newClient });
  } catch (error) {
    if (error.code === "DUPLICATE_EMAIL") {
      return res.status(409).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error occurred." });
  }
});

// 2. NEW INVOICE CONTROLLER: Processes bills with multi-row item arrays
app.post("/api/invoices", async (req, res) => {
  console.log("📥 Incoming Invoice Payload:", req.body);
  const { client_id, invoice_number, due_date, items } = req.body;

  // Gatekeeper Check: Ensure all mandatory parameters exist
  if (
    !client_id ||
    !invoice_number ||
    !due_date ||
    !items ||
    !Array.isArray(items)
  ) {
    return res.status(400).json({
      error: "Missing required billing fields or items is not an array.",
    });
  }

  try {
    // Forward parameters down to our SQL Transaction machine
    const completedInvoice = await invoiceService.createFullInvoice(
      client_id,
      invoice_number,
      due_date,
      items,
    );

    return res.status(201).json({
      message:
        "Invoice and line items created successfully inside a secure transaction!",
      invoice: completedInvoice,
    });
  } catch (error) {
    console.error(
      "❌ Invoice controller caught transaction failure:",
      error.message,
    );
    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "Failed to process invoice due to an internal transactional failure.",
    });
  }
});

app.get("/api/analytics/overview", async (req, res) => {
  try {
    const metrics = await analyticsRepository.getOverviewMetrics();
    return res.json({
      message: "Analytics calculations computed successfully!",
      data: metrics,
    });
  } catch (error) {
    console.error("❌ Analytics route failure:", error.message);
    return res
      .status(500)
      .json({ error: "Failed to calculate business metrics." });
  }
});

app.patch("/api/invoices/:id/settle", async (req, res) => {
  const invoiceId = parseInt(req.params.id, 10);
  try {
    const settledInvoice = await invoiceService.settleInvoiceBalance(invoiceId);
    return res.json({
      message: "Invoice balance settled and marked as PAID successfully",
      invoice: settledInvoice,
    });
  } catch (error) {
    console.error("Settlement route failure", error.message);
    return res.status(500).json({
      error: error.message || "failed to uupdate financial asset state",
    });
  }
});

// 7. LIST ENDPOINT: Streams the entire joined invoice transaction history array
app.get("/api/invoices", async (req, res) => {
  try {
    const invoices = await invoiceService.getAllInvoices();
    return res.json({
      message: "Invoice ledger directories retrieved successfully!",
      invoices: invoices,
    });
  } catch (error) {
    console.error("❌ Invoice ledger loading failure:", error.message);
    return res
      .status(500)
      .json({ error: "Failed to load transaction ledger records." });
  }
});

app.get("/api/clients", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name FROM clients ORDER BY name ASC;",
    );
    return res.json({
      message: "Client directories retrieved successfully",
      clients: result.rows,
    });
  } catch (error) {}
});

// 8. FILE STREAM ENDPOINT: Compiles data-joins and exports crisp PDF bank statements
app.get("/api/invoices/:id/pdf", async (req, res) => {
  const invoiceId = parseInt(req.params.id, 10);

  try {
    // Pull master records using our existing transactional joins
    const invoices = await invoiceService.getAllInvoices();
    const invoice = invoices.find((i) => i.id === invoiceId);

    if (!invoice) {
      return res
        .status(404)
        .json({ error: "Statement record not found inside database pools." });
    }

    // Initialize a clean PDF stream pipeline document container
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // Set response headers to trigger an immediate browser local download allocation
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=STATEMENT-${invoice.invoice_number}.pdf`,
    );

    doc.pipe(res);

    // --- DRAW THE PREMIUM FINANCIAL LAYOUT CANVAS ---
    doc
      .fillColor("#0f172a")
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("LEDGERFLOW FINANCIAL STATEMENT", { align: "center" });
    doc.moveDown(1);

    doc
      .strokeColor("#e2e8f0")
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();
    doc.moveDown(1.5);

    doc
      .fillColor("#334155")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("METADATA TRANSACTION LEDGER LOGS");
    doc.moveDown(0.5);
    doc
      .font("Helvetica")
      .fillColor("#0f172a")
      .text(`Invoice Serial Tracking Number: ${invoice.invoice_number}`)
      .text(`Target Customer Account Name: ${invoice.client_name}`)
      .text(
        `Settlement Maturity Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`,
      )
      .text(`Operational Pipeline Status: ${invoice.status.toUpperCase()}`);

    doc.moveDown(2);

    // Draw Account Totals Summary
    doc
      .fillColor("#334155")
      .font("Helvetica-Bold")
      .text("AGGREGATE ACCOUNT BALANCES");
    doc.moveDown(0.5);

    const dollarFormat = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(invoice.total_amount_cents / 100);
    doc
      .font("Helvetica")
      .fillColor("#0f172a")
      .text(`Total Gross Document Valuation: ${dollarFormat}`);

    doc.moveDown(3);
    doc
      .strokeColor("#e2e8f0")
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();
    doc.moveDown(1);

    doc
      .fontSize(8)
      .fillColor("#94a3b8")
      .text(
        "This document is compiled automatically via LedgerFlow relational core database servers. AI responses may include mistakes.",
        { align: "center" },
      );

    // Seal and finalize the byte stream container
    doc.end();
  } catch (error) {
    console.error("❌ PDF Stream Engine Fault:", error.message);
    return res
      .status(500)
      .json({ error: "Failed to compile financial PDF asset stream." });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const newUser = await authService.register(username, password);
    return res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    return res.status(400).json({ status: false, error: error.message });
  }
});
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const session = await authService.login(username, password);
    return res.json({
      success: true,
      token: session.token,
      user: session.user,
    });
  } catch (error) {
    return res.status(401).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 LedgerFlow backend listening on http://localhost:${PORT}`);
});
