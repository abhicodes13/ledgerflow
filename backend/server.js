const express = require("express");
const pool = require("./db");
const clientService = require("./clientService");
const invoiceService = require("./invoiceService"); // 1. Import our new invoice service layer
const analyticsRepository = require("./analyticsRepository");

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

app.listen(PORT, () => {
  console.log(`🚀 LedgerFlow backend listening on http://localhost:${PORT}`);
});
