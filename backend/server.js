const express = require("express");
const pool = require("./db");
const clientService = require("./clientService");
const invoiceService = require("./invoiceService");
const analyticsRepository = require("./analyticsRepository");
const PDFDocument = require("pdfkit");
const authService = require("./authService");
const authenticateToken = require("./authMiddleware"); // ⚡ Master Gatekeeper Guard

const app = express();
const PORT = 3000;
app.use(express.json());

// =========================================================================
// SYSTEM HEALTH METER
// =========================================================================
app.get("/api/health", async (req, res) => {
  try {
    const dbResult = await pool.query("SELECT NOW()");
    res.json({
      status: "healthy",
      message: "Server is running perfectly!",
      database_time: dbResult.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({ status: "unhealthy", error: error.message });
  }
});

// =========================================================================
// SECURITY PORTAL ENDPOINTS (STAGE 2)
// =========================================================================
app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const newUser = await authService.register(username, password);
    return res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
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

// =========================================================================
// SECURED MULTI-TENANT CHANNELS (STAGE 3 UNLOCKED ⚡)
// =========================================================================

// PATH A: REGISTER CLIENT UNDER ACTIVE USER ACCOUNT
app.post("/api/clients", authenticateToken, async (req, res) => {
  const activeUserId = req.user.userId; // Extracted safely from the encrypted JWT!
  const { name, email } = req.body;

  if (!name || !email) {
    return res
      .status(400)
      .json({ error: "Name and email are required fields." });
  }

  try {
    // ⚡ Pass activeUserId down to bind the fresh client to this user account
    const newClient = await clientService.registerClient(
      activeUserId,
      name,
      email,
    );
    return res
      .status(201)
      .json({ message: "Client created successfully", client: newClient });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATH B: FETCH ALL CLIENTS LINKED TO ACTIVE USER ACCOUNT
app.get("/api/clients", authenticateToken, async (req, res) => {
  const activeUserId = req.user.userId;
  try {
    const result = await pool.query(
      "SELECT * FROM clients WHERE user_id = $1 ORDER BY name ASC;",
      [activeUserId],
    );
    return res.json({ success: true, clients: result.rows });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PATH C: GENERATE MULTI-ROW INVOICE CONTAINER
app.post("/api/invoices", authenticateToken, async (req, res) => {
  const activeUserId = req.user.userId;
  const { client_id, invoice_number, due_date, items } = req.body;

  if (
    !client_id ||
    !invoice_number ||
    !due_date ||
    !items ||
    !Array.isArray(items)
  ) {
    return res
      .status(400)
      .json({
        error: "Missing required billing fields or items layout shape.",
      });
  }

  try {
    // ⚡ Pass activeUserId down into your database transactional engines
    const completedInvoice = await invoiceService.createFullInvoice(
      activeUserId,
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
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PATH D: FETCH ALL INVOICES LINKED TO ACTIVE USER ACCOUNT
app.get("/api/invoices", authenticateToken, async (req, res) => {
  const activeUserId = req.user.userId;
  try {
    const invoices = await invoiceService.getAllInvoices(activeUserId);
    return res.json({
      message: "Invoice ledger directories retrieved successfully!",
      invoices: invoices,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATH E: SETTLE ACCOUNT INVOICE BALANCE
app.patch("/api/invoices/:id/settle", authenticateToken, async (req, res) => {
  const activeUserId = req.user.userId;
  const invoiceId = parseInt(req.params.id, 10);

  try {
    // ⚡ Enforce ownership validation checks on the service level during settlement
    const settledInvoice = await invoiceService.settleInvoiceBalance(
      invoiceId,
      activeUserId,
    );
    return res.json({
      message: "Invoice balance settled and marked as PAID successfully",
      invoice: settledInvoice,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATH F: ANALYTICS OVERVIEW TILES
app.get("/api/analytics/overview", authenticateToken, async (req, res) => {
  const activeUserId = req.user.userId;
  try {
    const metrics = await analyticsRepository.getOverviewMetrics(activeUserId);
    return res.json({
      message: "Analytics calculations computed successfully!",
      data: metrics,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to calculate business metrics." });
  }
});

// PATH G: EXPORT SECURITY FINANCES BANK STATEMENT PDF
app.get("/api/invoices/:id/pdf", authenticateToken, async (req, res) => {
  const activeUserId = req.user.userId;
  const invoiceId = parseInt(req.params.id, 10);

  try {
    const invoices = await invoiceService.getAllInvoices(activeUserId);
    const invoice = invoices.find((i) => i.id === invoiceId);

    if (!invoice) {
      return res
        .status(404)
        .json({
          error:
            "Statement record not found inside your authorized sandbox database rows.",
        });
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=STATEMENT-${invoice.invoice_number}.pdf`,
    );
    doc.pipe(res);

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
        "This document is compiled automatically via LedgerFlow relational core database servers.",
        { align: "center" },
      );

    doc.end();
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to compile financial PDF asset stream." });
  }
});

app.listen(PORT, () => {
  console.log(
    `⚡ [LEDGERFLOW ENGINE] Secured multi-tenant gates running live on Port 3000.`,
  );
});
