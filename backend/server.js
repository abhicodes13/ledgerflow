require("dotenv").config();
const express = require("express");
const pool = require("./db");
const clientService = require("./clientService");
const invoiceService = require("./invoiceService");
const analyticsRepository = require("./analyticsRepository");
const PDFDocument = require("pdfkit");
const authService = require("./authService");
const authenticateToken = require("./authMiddleware"); // ⚡ Master Gatekeeper Guard
const checkSubscription = require("./subscriptionMiddleware");
const paymentRouter = require("./payment");
const { GoogleGenAI } = require("@google/genai");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;
app.use(
  cors({
    origin: "http://localhost:5173", // Welcomes your local frontend port mapping safely
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use("/api/payment", paymentRouter);

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
app.post(
  "/api/clients",
  authenticateToken,

  async (req, res) => {
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
  },
);

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
    return res.status(400).json({
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

// =========================================================================
// PATH G: EXPORT SECURITY FINANCES BANK STATEMENT PDF (STAGE 4 SCALED ⚡)
// =========================================================================
app.get("/api/invoices/:id/pdf", authenticateToken, async (req, res) => {
  const activeUserId = req.user.userId;
  const invoiceId = parseInt(req.params.id, 10);

  try {
    // 1. Pull the master parent record container details
    const invoices = await invoiceService.getAllInvoices(activeUserId);
    const invoice = invoices.find((i) => i.id === invoiceId);

    if (!invoice) {
      return res.status(404).json({
        error:
          "Statement record not found inside your authorized sandbox database rows.",
      });
    }

    // 2. Fetch the corresponding granular child line rows from the invoice items table
    const itemsResult = await pool.query(
      "SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id ASC;",
      [invoiceId],
    );
    const invoiceItems = itemsResult.rows;

    // 3. Initialize a clean PDF binary stream container document
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

    // Header Metadata Corner
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

    // --- ⚡ NEW STAGE 4 MULTI-ITEM ITEMIZED TABLE MATRIX ---
    doc
      .fillColor("#334155")
      .font("Helvetica-Bold")
      .text("ITEMIZED TRANSACTION LINE CHARGES");
    doc.moveDown(0.5);

    // Print Grid Header Labels
    let currentY = doc.y;
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#64748b");
    doc.text("Description / Service Allocation", 50, currentY, { width: 250 });
    doc.text("Qty", 320, currentY, { width: 30, align: "right" });
    doc.text("Unit Price", 380, currentY, { width: 70, align: "right" });
    doc.text("Line Total", 475, currentY, { width: 70, align: "right" });

    doc.moveDown(0.5);
    doc
      .strokeColor("#cbd5e1")
      .lineWidth(0.5)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();
    doc.moveDown(0.5);

    // Loop dynamically through child dataset elements to draw incremental table grid rows
    doc.font("Helvetica").fillColor("#0f172a");
    for (const item of invoiceItems) {
      currentY = doc.y;
      const lineTotalCents = item.quantity * item.unit_amount_cents;

      // Anti-Collision Text Shield: Stop long descriptions from breaking text layout positioning grid slots
      doc.text(item.description, 50, currentY, { width: 250 });
      doc.text(item.quantity.toString(), 320, currentY, {
        width: 30,
        align: "right",
      });
      doc.text(dollarFormat(item.unit_amount_cents), 380, currentY, {
        width: 70,
        align: "right",
      });
      doc.text(dollarFormat(lineTotalCents), 475, currentY, {
        width: 70,
        align: "right",
      });

      doc.moveDown(0.8); // Advance vertical pen down cleanly past text lines
    }

    doc.moveDown(1);
    doc
      .strokeColor("#cbd5e1")
      .lineWidth(0.5)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();
    doc.moveDown(1.5);

    // Grand Totals Calculation Alignment Summary Block
    doc
      .fillColor("#334155")
      .font("Helvetica-Bold")
      .text("AGGREGATE ACCOUNT TOTALS", 50, doc.y);
    doc.moveDown(0.5);
    doc
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text(
        `Total Gross Document Valuation: ${dollarFormat(invoice.total_amount_cents)}`,
        50,
        doc.y,
      );

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

    // Seal byte stream pipeline completely
    doc.end();
  } catch (error) {
    console.error("❌ PDF Multi-Item Engine Failure:", error.message);
    return res
      .status(500)
      .json({ error: "Failed to compile financial PDF asset stream loop." });
  }
});

// Define the precise tools (your existing backend code functions) that Gemini can use
const aiTools = [
  {
    functionDeclarations: [
      // TOOL 1: REGISTER CLIENT
      {
        name: "registerNewClient",
        description:
          "Registers a brand new client or customer under the active user account.",
        parameters: {
          type: "OBJECT",
          properties: {
            name: {
              type: "STRING",
              description: "The full name of the client or company.",
            },
            email: {
              type: "STRING",
              description: "The unique email address of the client.",
            },
          },
          required: ["name", "email"],
        },
      },
      // TOOL 2: DRAFT INVOICE
      {
        name: "draftNewInvoice",
        description:
          "Prepares a new single or multi-line item invoice draft for an existing client identification number.",
        parameters: {
          type: "OBJECT",
          properties: {
            clientId: {
              type: "NUMBER",
              description: "The database ID integer of the target client.",
            },
            dueDate: {
              type: "STRING",
              description:
                "The due date of the invoice formatted explicitly as YYYY-MM-DD.",
            },
            description: {
              type: "STRING",
              description:
                "The text description of the work or services rendered.",
            },
            amountCents: {
              type: "NUMBER",
              description:
                "The total dollar amount translated strictly into cents (e.g., $150.00 is 15000).",
            },
          },
          required: ["clientId", "dueDate", "description", "amountCents"],
        },
      },
      // TOOL 3: SETTLE INVOICE BALANCE
      {
        name: "settleInvoiceBalance",
        description:
          "Marks an outstanding invoice record balance as fully settled and paid inside the system ledger.",
        parameters: {
          type: "OBJECT",
          properties: {
            invoiceId: {
              type: "NUMBER",
              description:
                "The database ID integer of the invoice being marked as paid.",
            },
          },
          required: ["invoiceId"],
        },
      },
      // TOOL 4: FETCH BUSINESS METRICS
      {
        name: "calculateBusinessMetrics",
        description:
          "Queries the system analytical ledgers to pull total Monthly Recurring Revenue (MRR), outstanding payments, and cash totals.",
        parameters: {
          type: "OBJECT",
          properties: {}, // No parameters required; it pulls contextual statistics for the active user token
        },
      },
    ],
  },
];

// 🟢 PART 1 OF 3: ENHANCED ENDPOINT INITIALIZER & DIRECT CAPABILITY RADAR INTERCEPTOR
app.post("/api/chat", authenticateToken, async (req, res) => {
  const activeUserId = req.user ? req.user.userId : 1;
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Message content cannot be blank." });
  }

  try {
    const capabilityKeywords = [
      "what can you do",
      "help",
      "menu",
      "capabilities",
      "features",
      "options",
    ];
    const lowercaseMsg = message.toLowerCase();

    // 🛡️ CORRECTION: Checks each individual word string item (kw) sequentially inside the message loop
    if (capabilityKeywords.some((kw) => lowercaseMsg.includes(kw))) {
      // Bypasses LLM compute pools entirely, serving your clean component keys straight to your UI panel
      return res.json({
        type: "action_deck",
        message:
          "Welcome to your active LedgerFlow workspace hub. Click an action card helper below or input a standard text prompt to execute autonomous system directives hands-free:",
        data: {},
      });
    }

    // Initialize the SDK using your fresh environment variable key
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Send the user input along with our tools matrix down to gemini-2.5-flash
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: message,
      config: {
        tools: aiTools,
      },
    });

    // =========================================================================
    // DYNAMIC TOOL INTERCEPT DISTRIBUTOR
    // =========================================================================
    const functionCall = response.functionCalls?.[0];

    if (functionCall) {
      const toolName = functionCall.name;
      const args = functionCall.args;

      console.log(
        `🤖 [AI AGENT] Gemini intelligently selected tool: ${toolName}`,
      );

      // BRANCH 1: REGISTER CLIENT GATEWAY
      if (toolName === "registerNewClient") {
        return res.json({
          type: "approval_required",
          action: "create_client",
          message: `I've prepared a draft to register **${args.name}** (${args.email}) as a new customer. Please confirm to save.`,
          data: { name: args.name, email: args.email },
        });
      }

      // BRANCH 2: DRAFT INVOICE GATEWAY
      else if (toolName === "draftNewInvoice") {
        const amountDollars = (args.amountCents / 100).toFixed(2);
        return res.json({
          type: "approval_required",
          action: "create_invoice",
          message: `I've structured a new invoice draft for Client ID **#${args.clientId}** totaling **$${amountDollars}** due on **${args.dueDate}**. Proceed with generation?`,
          data: {
            client_id: args.clientId,
            due_date: args.dueDate,
            description: args.description,
            amount_cents: args.amountCents,
          },
        });
      }

      // BRANCH 3: SETTLE INVOICE BALANCE GATEWAY
      else if (toolName === "settleInvoiceBalance") {
        return res.json({
          type: "approval_required",
          action: "settle_invoice",
          message: `I've located Invoice ID **#${args.invoiceId}**. Would you like me to officially mark this statement balance as paid inside the ledger?`,
          data: { invoiceId: args.invoiceId },
        });
      }

      // BRANCH 4: ANALYTICS INTENT READ (No approval needed since it's just a read operation!)
      else if (toolName === "calculateBusinessMetrics") {
        const metrics =
          await analyticsRepository.getOverviewMetrics(activeUserId);

        // Feed the raw data back to Gemini to synthesize a beautiful, conversational brief!
        const briefResponse = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: `Express these business statistics to the user in a short, motivating executive summary text paragraph: ${JSON.stringify(metrics)}`,
        });

        return res.json({
          type: "text",
          message: briefResponse.text,
        });
      }
    }

    // Fallback: If Gemini didn't trigger a function tool call, return its natural conversational reply
    return res.json({
      type: "text",
      message: response.text,
    });
  } catch (error) {
    if (
      error.message.includes("503") ||
      error.message.includes("UNAVAILABLE")
    ) {
      return res.status(200).json({
        type: "text",
        message:
          "🤖 [AI Companion]: I can see you want to add Tony Stark, but my core language processor is experiencing heavy global traffic right now. Please try submitting that message again in a few moments!",
      });
    }

    res
      .status(500)
      .json({ error: "Failed to process conversational agent metrics." });
  }
});

// =========================================================================
// 🔓 AGENTIC EXECUTION GATEWAY (Finishes the AI Handshake)
// =========================================================================
app.post("/api/chat/confirm", authenticateToken, async (req, res) => {
  const activeUserId = req.user ? req.user.userId : 1; // Secure fallback for local testing
  const { action, data } = req.body;

  if (!action || !data) {
    return res
      .status(400)
      .json({ error: "Missing action execution parameters." });
  }

  try {
    console.log(`📡 [EXECUTION GATE] Committing AI approved action: ${action}`);

    // ACTION A: Save the client rows to Postgres
    if (action === "create_client") {
      const newClient = await clientService.registerClient(
        activeUserId,
        data.name,
        data.email,
      );
      return res.status(201).json({
        success: true,
        message: "🏆 Client successfully created and saved to ledger!",
        client: newClient,
      });
    }

    // ACTION B: Save the invoice transactional rows to Postgres
    else if (action === "create_invoice") {
      // Structure the input data arrays to match your invoiceService expectations
      const itemsArray = [
        {
          description: data.description,
          quantity: 1,
          unit_amount_cents: data.amount_cents,
        },
      ];

      const completedInvoice = await invoiceService.createFullInvoice(
        activeUserId,
        data.client_id,
        `INV-${Date.now().toString().slice(-6)}`, // Auto-generate a clean timestamp invoice code
        data.due_date,
        itemsArray,
      );

      return res.status(201).json({
        success: true,
        message: "🏆 Invoice transaction written to database successfully!",
        invoice: completedInvoice,
      });
    }

    // ACTION C: Settle and mark balance as paid
    else if (action === "settle_invoice") {
      const settledInvoice = await invoiceService.settleInvoiceBalance(
        data.invoiceId,
        activeUserId,
      );
      return res.json({
        success: true,
        message: "🏆 Invoice balance settled successfully!",
        invoice: settledInvoice,
      });
    }

    return res
      .status(400)
      .json({ error: "Unrecognized action parameter layout." });
  } catch (error) {
    console.error("❌ Agentic Execution Failure:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `⚡ [LEDGERFLOW ENGINE] Secured multi-tenant gates running live on Port 3000.`,
  );
});
