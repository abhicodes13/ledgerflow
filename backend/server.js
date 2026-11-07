// =========================================================================
// 🚀 ENTERPRISE COBALT API INFRASTRUCTURE: PART 1 OF 4 (PRODUCTION OVERHAUL)
// =========================================================================
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

// 🛡️ SECURITY TWEAK: Dynamic Environment Origin Matrix
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_PRODUCTION_URL, // Dynamic placeholder for cloud-deployed frontends (Vercel/Netlify)
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow browser testing tools, local curls, or matching origin array entities seamlessly
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(
          new Error(
            "Security Restriction: CORS policy violation on production layer routes.",
          ),
        );
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/api/payment", paymentRouter);
app.use(express.json());

// =========================================================================
// SYSTEM HEALTH METER
// =========================================================================
app.get("/api/health", async (req, res) => {
  try {
    // Direct verification ping query tests the health of active Postgres sockets
    const dbResult = await pool.query("SELECT NOW()");
    res.json({
      status: "healthy",
      message: "Server infrastructure is running optimally.",
      database_time: dbResult.rows[0].now,
    });
  } catch (error) {
    console.error("❌ Infrastructure Health Check Degradation:", error.message);
    res.status(500).json({ status: "unhealthy", error: error.message });
  }
});

// =========================================================================
// SECURITY PORTAL ENDPOINTS
// =========================================================================
app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: "Credentials fields cannot be left blank.",
    });
  }

  try {
    const newUser = await authService.register(username, password);
    return res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: "Credentials fields cannot be left blank.",
    });
  }

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
  // 🛡️ SECURITY DEFENSIBILITY: Enforce explicit user key resolution bindings
  const activeUserId = req.user.userId || req.user.id;
  const { name, email } = req.body;

  if (!name || !email) {
    return res
      .status(400)
      .json({ error: "Name and email are required fields." });
  }

  try {
    const newClient = await clientService.registerClient(
      parseInt(activeUserId, 10),
      name.trim(),
      email.trim().toLowerCase(),
    );
    return res
      .status(201)
      .json({ message: "Client created successfully", client: newClient });
  } catch (error) {
    console.error("❌ Client Registration Allocation Deficit:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// PATH B: FETCH ALL CLIENTS LINKED TO ACTIVE USER ACCOUNT
app.get("/api/clients", authenticateToken, async (req, res) => {
  const activeUserId = req.user.userId || req.user.id;
  try {
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM clients WHERE user_id = $1 ORDER BY name ASC;",
      [parseInt(activeUserId, 10)],
    );
    return res.json({ success: true, clients: result.rows });
  } catch (error) {
    console.error("❌ Clients Fetch Query Halt:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PATH C: GENERATE MULTI-ROW INVOICE CONTAINER
app.post("/api/invoices", authenticateToken, async (req, res) => {
  const activeUserId = req.user.userId || req.user.id;
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
    const completedInvoice = await invoiceService.createFullInvoice(
      parseInt(activeUserId, 10),
      parseInt(client_id, 10),
      invoice_number.trim(),
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
      "❌ Parent Invoice Transaction Exception Abort:",
      error.message,
    );
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PATH D: FETCH ALL INVOICES LINKED TO ACTIVE USER ACCOUNT
app.get("/api/invoices", authenticateToken, async (req, res) => {
  const activeUserId = req.user.userId || req.user.id;
  try {
    const invoices = await invoiceService.getAllInvoices(
      parseInt(activeUserId, 10),
    );
    return res.json({
      message: "Invoice ledger directories retrieved successfully!",
      invoices: invoices,
    });
  } catch (error) {
    console.error("❌ Ledger Directory Retrieval Bottleneck:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// PATH E: SETTLE ACCOUNT INVOICE BALANCE
app.patch("/api/invoices/:id/settle", authenticateToken, async (req, res) => {
  const activeUserId = req.user.userId || req.user.id;
  const invoiceId = parseInt(req.params.id, 10);

  if (isNaN(invoiceId)) {
    return res
      .status(400)
      .json({ error: "Invalid resource identity parameter hash format." });
  }

  try {
    const settledInvoice = await invoiceService.settleInvoiceBalance(
      invoiceId,
      parseInt(activeUserId, 10),
    );
    return res.json({
      message: "Invoice balance settled and marked as PAID successfully",
      invoice: settledInvoice,
    });
  } catch (error) {
    console.error(
      "❌ Settlement Resolution Exception Rejection:",
      error.message,
    );
    return res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// 🚀 ENTERPRISE COBALT API INFRASTRUCTURE: PART 2 OF 4 (PRODUCTION OVERHAUL)
// =========================================================================

// PATH F: ANALYTICS OVERVIEW TILES
app.get("/api/analytics/overview", authenticateToken, async (req, res) => {
  // 🛡️ SECURITY DEFENSIBILITY: Unified user account identity fallback nodes
  const activeUserId = req.user.userId || req.user.id;

  try {
    const metrics = await analyticsRepository.getOverviewMetrics(
      parseInt(activeUserId, 10),
    );
    return res.json({
      message: "Analytics calculations computed successfully!",
      data: metrics,
    });
  } catch (error) {
    console.error("❌ Analytics Repository Engine Halt:", error.message);
    return res.status(500).json({
      error: "Failed to calculate business metrics database aggregates.",
    });
  }
});

// =========================================================================
// PATH G: EXPORT SECURITY FINANCES BANK STATEMENT PDF (STAGE 4 SCALED ⚡)
// =========================================================================
app.get("/api/invoices/:id/pdf", authenticateToken, async (req, res) => {
  const activeUserId = req.user.userId || req.user.id;
  const invoiceId = parseInt(req.params.id, 10);

  if (isNaN(invoiceId)) {
    return res
      .status(400)
      .json({ error: "Invalid resource identity parameter format." });
  }

  try {
    // 🛡️ PERFORMANCE TWEAK: Direct database indexing query prevents heavy memory leaks
    const invoiceQueryResult = await pool.query(
      `SELECT i.*, c.name as client_name, c.email as client_email 
       FROM invoices i 
       JOIN clients c ON i.client_id = c.id 
       WHERE i.id = $1 AND i.user_id = $2 LIMIT 1;`,
      [invoiceId, parseInt(activeUserId, 10)],
    );

    const invoice = invoiceQueryResult.rows[0];

    if (!invoice) {
      return res.status(404).json({
        error:
          "Statement record not found inside your authorized sandbox database rows.",
      });
    }

    // 2. Fetch the corresponding granular child line rows from the invoice items table
    const itemsResult = await pool.query(
      "SELECT description, quantity, unit_amount_cents FROM invoice_items WHERE invoice_id = $1 ORDER BY id ASC;",
      [invoiceId],
    );
    const invoiceItems = itemsResult.rows;

    // 3. Initialize a clean PDF binary stream container document
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // Set headers explicitly to stream binary data smoothly to browser streams
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
      .fontSize(22)
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
        `Settlement Maturity Due Date: ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "N/A"}`,
      )
      .text(
        `Operational Pipeline Status: ${invoice.status ? invoice.status.toUpperCase() : "PENDING"}`,
      );
    doc.moveDown(2);

    // --- ⚡ ITEMIZED TABLE MATRIX ---
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

      // 🛡️ SECURITY SECURITY: Dynamic Page Height Overflow Shield prevents canvas clipping
      if (currentY > 720) {
        doc.addPage();
        doc.font("Helvetica").fillColor("#0f172a");
        currentY = doc.y + 20;
      }

      const lineTotalCents =
        parseInt(item.quantity, 10) * parseInt(item.unit_amount_cents, 10);

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
    if (doc.y > 700) doc.addPage();

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
    console.error("❌ PDF Multi-Item Engine Failure Exception:", error.message);
    // Force header reset to avoid broken pipe stream drops before responding
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        error:
          "Failed to compile financial PDF asset stream loop due to an internal system exception.",
      });
    }
  }
});

// =========================================================================
// 🚀 ENTERPRISE COBALT API INFRASTRUCTURE: PART 3 OF 4 (PRODUCTION OVERHAUL)
// =========================================================================

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
      // TOOL 2: DRAFT INVOICE (UNIFORM COMPOSITE LINE ITEM STRUCT)
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
                "The text description of the primary service line allocation.",
            },
            amountCents: {
              type: "NUMBER",
              description:
                "The total amount translated strictly into cents (e.g., $150.00 is 15000).",
            },
            items: {
              type: "ARRAY",
              description:
                "Optional itemized line breakdown arrays for multi-item invoices.",
              items: {
                type: "OBJECT",
                properties: {
                  description: { type: "STRING" },
                  quantity: { type: "NUMBER" },
                  price: {
                    type: "NUMBER",
                    description: "Rate valuation in single dollars.",
                  },
                },
              },
            },
          },
          required: ["clientId", "dueDate"],
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
          properties: {},
        },
      },
    ],
  },
];

// ENHANCED ENDPOINT INITIALIZER & DIRECT CAPABILITY RADAR INTERCEPTOR
app.post("/api/chat", authenticateToken, async (req, res) => {
  const activeUserId = req.user.userId || req.user.id || 1;
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

    if (capabilityKeywords.some((kw) => lowercaseMsg.includes(kw))) {
      return res.json({
        type: "action_deck",
        message:
          "Welcome to your active LedgerFlow workspace hub. Click an action card helper below or input a standard text prompt to execute autonomous system directives hands-free:",
        data: {},
      });
    }

    // Initialize the SDK using your environment variable key safely
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Send the user input along with our tools matrix down to production-stable gemini model
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: message,
      config: {
        tools: aiTools,
      },
    });

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

      // BRANCH 2: DRAFT INVOICE GATEWAY (ITEM-ARRAY CAPABLE BUILDER)
      else if (toolName === "draftNewInvoice") {
        const fallBackPriceCents = args.amountCents || 150000;
        const amountDollars = (fallBackPriceCents / 100).toFixed(2);

        // Dynamic map: Map multi-item arrays if provided, otherwise compile a clean single item block array
        const compiledInvoiceItems = args.items || [
          {
            description:
              args.description || "Operational Technical Consulting Services",
            quantity: 1,
            price: parseFloat(amountDollars),
          },
        ];

        return res.json({
          type: "approval_required",
          action: "create_invoice",
          message: `I've structured a new invoice draft for Client ID **#${args.clientId}** totaling **$${amountDollars}** due on **${args.dueDate}**. Proceed with generation?`,
          data: {
            client_id: parseInt(args.clientId, 10),
            invoice_number:
              args.invoice_number ||
              `INV-${Math.floor(1000 + Math.random() * 9000)}`,
            due_date: args.dueDate,
            items: compiledInvoiceItems,
          },
        });
      }

      // BRANCH 3: SETTLE INVOICE BALANCE GATEWAY
      else if (toolName === "settleInvoiceBalance") {
        return res.json({
          type: "approval_required",
          action: "settle_invoice",
          message: `I've located Invoice ID **#${args.invoiceId}**. Would you like me to officially mark this statement balance as paid inside the ledger?`,
          data: { invoiceId: parseInt(args.invoiceId, 10) },
        });
      }

      // BRANCH 4: ANALYTICS INTENT READ
      else if (toolName === "calculateBusinessMetrics") {
        const metrics = await analyticsRepository.getOverviewMetrics(
          parseInt(activeUserId, 10),
        );

        const briefResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
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
    console.error("❌ AI Core Processing Deficit Exception:", error.message);

    if (
      error.message.includes("503") ||
      error.message.includes("UNAVAILABLE")
    ) {
      return res.status(200).json({
        type: "text",
        message:
          "🤖 [AI Companion]: My language processor is experiencing heavy global traffic right now. Please try submitting that message again in a few moments!",
      });
    }

    return res
      .status(500)
      .json({ error: "Failed to process conversational agent metrics." });
  }
});

// =========================================================================
// 🚀 ENTERPRISE COBALT API INFRASTRUCTURE: PART 4 OF 4 (PRODUCTION OVERHAUL)
// =========================================================================

// PATH H: AGGREGATE AGENTIC WORKFLOW EXECUTION GATEWAY HANDSHAKE
app.post("/api/chat/confirm", authenticateToken, async (req, res) => {
  // Acquire an active client connection handle from the postgres pool to manage transactions
  const client = await pool.connect();

  try {
    const { action, data } = req.body;

    // 🛡️ SECURITY DEFENSIBILITY: Enforce explicit token user key resolution bindings
    const userId = req.user.userId || req.user.id;

    if (!action || !data) {
      return res
        .status(400)
        .json({ error: "Missing verification packet payload frames." });
    }

    // Initialize transaction isolation boundaries to guarantee all-or-nothing array writes
    await client.query("BEGIN");

    // =========================================================================
    // CODE SLOT A: AI WORKFLOW ROUTE -> COMMITTING AN INVOICE REGISTRY PROFILE
    // =========================================================================
    if (action === "create_invoice") {
      let client_id = data.client_id;
      let invoice_number =
        data.invoice_number || `INV-${Math.floor(1000 + Math.random() * 9000)}`;

      // Fallback timeline limits match standard SaaS 14-day net maturity cycles
      const due_date =
        data.due_date ||
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      const items = Array.isArray(data.items) ? data.items : [];

      // 🛡️ ANTI-COLLISION ENGINE: Auto-resolve matching serial unique index blocks
      const duplicateSerialCheck = await client.query(
        "SELECT id FROM invoices WHERE invoice_number = $1 AND user_id = $2 LIMIT 1",
        [invoice_number, parseInt(userId, 10)],
      );

      if (duplicateSerialCheck.rows.length > 0) {
        // Auto-increment a random numerical seed to prevent invoices_invoice_number_key abort exceptions
        invoice_number = `${invoice_number}-${Math.floor(100 + Math.random() * 900)}`;
      }

      // If the AI dropped a structural client_id but gave us a descriptive name string, resolve the reference
      if (!client_id && (data.client_name || data.name)) {
        const clientProfileQuery = await client.query(
          "SELECT id FROM clients WHERE name ILIKE $1 AND user_id = $2 LIMIT 1",
          [data.client_name || data.name, parseInt(userId, 10)],
        );
        if (clientProfileQuery.rows.length > 0) {
          client_id = clientProfileQuery.rows[0].id;
        }
      }

      // Fallback: If no tenant profile context is detected, map the log row to the oldest client record
      if (!client_id) {
        const structuralFallbackQuery = await client.query(
          "SELECT id FROM clients WHERE user_id = $1 ORDER BY id ASC LIMIT 1",
          [parseInt(userId, 10)],
        );
        if (structuralFallbackQuery.rows.length === 0) {
          throw new Error(
            "No client entity accounts are mapped to this workspace user token. Register a client first.",
          );
        }
        client_id = structuralFallbackQuery.rows[0].id;
      }

      // 🧮 TRANS-MAPPING SYSTEM: Flatten incoming pricing models to match your public.invoice_items schema
      const formattedItemsList = items.map((item) => {
        const qty = parseInt(item.quantity, 10) || 1;

        // Flexibly parse item pricing formats (dollars vs pennies strings) straight into unit_amount_cents column
        let rateCents = 0;
        if (item.unit_amount_cents !== undefined) {
          rateCents = parseInt(item.unit_amount_cents, 10) || 0;
        } else if (item.price !== undefined) {
          rateCents = Math.round(parseFloat(item.price) * 100) || 0;
        } else if (item.rate !== undefined) {
          rateCents = Math.round(parseFloat(item.rate) * 100) || 0;
        }

        return {
          description:
            item.description ||
            "Operational Engineering Consulting Services Framework Block",
          quantity: qty,
          unit_amount_cents: rateCents,
        };
      });

      // Insert primary billing row parameter record into table public.invoices
      const parentInvoiceResult = await client.query(
        `INSERT INTO invoices (user_id, client_id, invoice_number, status, due_date) 
         VALUES ($1, $2, $3, 'pending', $4) RETURNING id, invoice_number`,
        [
          parseInt(userId, 10),
          parseInt(client_id, 10),
          invoice_number.trim(),
          due_date,
        ],
      );

      const newInvoiceId = parentInvoiceResult.rows[0].id;
      const finalInvoiceSerial = parentInvoiceResult.rows[0].invoice_number;

      // Map line array parameters directly into child rows inside table public.invoice_items
      if (formattedItemsList.length > 0) {
        for (const line of formattedItemsList) {
          await client.query(
            `INSERT INTO invoice_items (invoice_id, description, quantity, unit_amount_cents) 
             VALUES ($1, $2, $3, $4)`,
            [
              parseInt(newInvoiceId, 10),
              line.description.trim(),
              parseInt(line.quantity, 10),
              parseInt(line.unit_amount_cents, 10),
            ],
          );
        }
      } else {
        // Structural Fallback Array: If lines were left blank, inject a single fallback ledger cell row
        await client.query(
          `INSERT INTO invoice_items (invoice_id, description, quantity, unit_amount_cents) 
           VALUES ($1, 'Technical Infrastructure Engineering Consulting Allocation', 1, 150000)`,
          [parseInt(newInvoiceId, 10)],
        );
      }

      // Securely lock down our transaction changes to commit rows
      await client.query("COMMIT");
      return res.status(200).json({
        message: `Statement ${finalInvoiceSerial} compiled and committed seamlessly to PostgreSQL with ${formattedItemsList.length || 1} explicit ledger items.`,
      });
    }

    // =========================================================================
    // CODE SLOT B: AI WORKFLOW ROUTE -> COMMITTING A NEW CLIENT LAYER INDEX
    // =========================================================================
    if (action === "create_client") {
      const name = data.name || data.client_name;
      // Build a smart custom fallback email link string if the operator left it out
      const email =
        data.email ||
        data.client_email ||
        `billing@${name?.toLowerCase().replace(/[^a-z0-9]/g, "") || "sandbox"}.io`;

      if (!name) {
        throw new Error(
          "Client account identity name field parameter string cannot be empty.",
        );
      }

      // Check unique constraint index match boundary to prevent duplicate crashes
      const existingClientCheck = await client.query(
        "SELECT id FROM clients WHERE email = $1 AND user_id = $2 LIMIT 1",
        [email.trim().toLowerCase(), parseInt(userId, 10)],
      );

      if (existingClientCheck.rows.length > 0) {
        await client.query("COMMIT");
        return res.status(200).json({
          message: `Client profile '${name}' is already verified inside your active workspace index mapping layers.`,
        });
      }

      const clientInsertResult = await client.query(
        "INSERT INTO clients (user_id, name, email) VALUES ($1, $2, $3) RETURNING name",
        [parseInt(userId, 10), name.trim(), email.trim().toLowerCase()],
      );

      await client.query("COMMIT");
      return res.status(200).json({
        message: `Client entity profile successfully generated for '${clientInsertResult.rows[0].name}' and committed to database.`,
      });
    }

    throw new Error(
      `The specified intent instruction macro '${action}' is not supported by current core endpoints.`,
    );
  } catch (err) {
    // If a collision happens, abort immediately and rollback all pending structural lines safely
    await client.query("ROLLBACK");
    console.error(
      "❌ Handshake Post-Approval Database Query Rollback Execution:",
      err.message,
    );
    return res.status(500).json({
      error:
        err.message || "Failed to commit autonomous tracking state blocks.",
    });
  } finally {
    // Release connection back to the database resource pool immediately
    client.release();
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `⚡ [LEDGERFLOW ENGINE] Secured multi-tenant production gates running live on Port ${PORT}.`,
  );
});
