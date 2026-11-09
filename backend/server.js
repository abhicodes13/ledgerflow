// =========================================================================
// LEDGERFLOW API SERVER
// =========================================================================
require("dotenv").config(); // must stay first so .env is loaded before other files read it

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { GoogleGenAI } = require("@google/genai");

const pool = require("./db");
const clientService = require("./clientService");
const invoiceService = require("./invoiceService");
const analyticsRepository = require("./analyticsRepository");
const authService = require("./authService");
const authenticateToken = require("./authMiddleware");
const checkSubscription = require("./subscriptionMiddleware"); // paywall: use AFTER authenticateToken
const paymentRouter = require("./payment");
const { AppError } = require("./errors");
const { generateInvoicePdfStream } = require("./utils/invoiceGenerator");

const app = express();
const PORT = process.env.PORT || 3000;

// Model names live in .env so they can change without editing code.
// (Defaults are the values this file used before; verify them against Google's current docs.)
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const GEMINI_SUMMARY_MODEL =
  process.env.GEMINI_SUMMARY_MODEL || "gemini-2.5-flash";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// =========================================================================
// HELPERS
// =========================================================================

// Reads the logged-in user's id from the verified token. Never falls back to a default user.
function getUserId(req) {
  const id = Number(req.user?.userId ?? req.user?.id);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError("Invalid session", 401);
  }
  return id;
}

// Known errors (AppError) show their message and status.
// Anything unexpected is logged and the user sees a generic 500.
function sendError(res, error, label) {
  if (error instanceof AppError) {
    return res
      .status(error.status)
      .json({ success: false, error: error.message, code: error.code });
  }
  console.error(`${label}:`, error);
  return res
    .status(500)
    .json({ success: false, error: "Something went wrong" });
}

// =========================================================================
// MIDDLEWARE (order matters)
// =========================================================================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_PRODUCTION_URL, // cloud-deployed frontend URL
].filter(Boolean);

// CORS first, so even rate-limit rejections carry CORS headers
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow tools like curl (no origin) and the allowed frontend origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Slow down password guessing on login/register
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
// Limit AI requests per IP, since every call costs money
app.use("/api/chat", rateLimit({ windowMs: 15 * 60 * 1000, max: 60 }));
// If you put this behind a load balancer (ALB), also add: app.set("trust proxy", 1);

// Mounted BEFORE express.json() on purpose: Stripe webhooks need the raw body.
app.use("/api/payment", paymentRouter);
app.use(express.json({ limit: "100kb" }));

// =========================================================================
// HEALTH
// =========================================================================
app.get("/api/health", async (req, res) => {
  try {
    const dbResult = await pool.query("SELECT NOW()");
    res.json({ status: "healthy", database_time: dbResult.rows[0].now });
  } catch (error) {
    console.error("Health check failed:", error.message);
    res.status(500).json({ status: "unhealthy" });
  }
});

// =========================================================================
// AUTH
// =========================================================================
app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const newUser = await authService.register(username, email, password);
    return res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    if (error instanceof authService.AuthError) {
      return res
        .status(error.status)
        .json({ success: false, error: error.message });
    }
    console.error("register failed:", error);
    return res
      .status(500)
      .json({ success: false, error: "Something went wrong" });
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
    if (error instanceof authService.AuthError) {
      return res
        .status(error.status)
        .json({ success: false, error: error.message });
    }
    console.error("login failed:", error);
    return res
      .status(500)
      .json({ success: false, error: "Something went wrong" });
  }
});

// =========================================================================
// CURRENT USER (login required, but NOT behind the paywall, so the frontend
// can read billing_status and decide whether to show the subscribe screen)
// =========================================================================
app.get("/api/me", authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await pool.query(
      `SELECT id, username, email, subscription_tier, billing_status, current_period_end
       FROM users WHERE id = $1`,
      [userId],
    );
    if (!result.rows[0]) throw new AppError("Account not found", 401);
    return res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    return sendError(res, error, "me failed");
  }
});

// =========================================================================
// CLIENTS  (everything below requires login AND an active subscription)
// =========================================================================
app.post(
  "/api/clients",
  authenticateToken,
  checkSubscription,
  async (req, res) => {
    try {
      const userId = getUserId(req);
      const { name, email, phone_number } = req.body;
      const client = await clientService.registerClient(
        userId,
        name,
        email,
        phone_number,
      );
      return res
        .status(201)
        .json({ message: "Client created successfully", client });
    } catch (error) {
      return sendError(res, error, "create client failed");
    }
  },
);

app.get(
  "/api/clients",
  authenticateToken,
  checkSubscription,
  async (req, res) => {
    try {
      const clients = await clientService.listClients(getUserId(req));
      return res.json({ success: true, clients });
    } catch (error) {
      return sendError(res, error, "list clients failed");
    }
  },
);

// =========================================================================
// INVOICES
// =========================================================================
app.post(
  "/api/invoices",
  authenticateToken,
  checkSubscription,
  async (req, res) => {
    try {
      const userId = getUserId(req);
      // invoice_number is optional: if omitted, the server generates the next one
      const { client_id, invoice_number, due_date, items } = req.body;
      const invoice = await invoiceService.createFullInvoice(
        userId,
        client_id,
        invoice_number,
        due_date,
        items,
      );
      return res.status(201).json({
        message:
          "Invoice and line items created successfully inside a secure transaction!",
        invoice,
      });
    } catch (error) {
      return sendError(res, error, "create invoice failed");
    }
  },
);

// Optional filters: ?status=pending&overdue=true&client_id=3&due_before=2026-12-31&limit=50&offset=0
app.get(
  "/api/invoices",
  authenticateToken,
  checkSubscription,
  async (req, res) => {
    try {
      const userId = getUserId(req);
      const { status, overdue, client_id, due_before, limit, offset } =
        req.query;
      const invoices = await invoiceService.getAllInvoices(userId, {
        status,
        overdue: overdue === "true",
        clientId: client_id ? Number(client_id) : undefined,
        dueBefore: due_before,
        limit,
        offset,
      });
      return res.json({ message: "Invoices retrieved successfully", invoices });
    } catch (error) {
      return sendError(res, error, "list invoices failed");
    }
  },
);

app.patch(
  "/api/invoices/:id/settle",
  authenticateToken,
  checkSubscription,
  async (req, res) => {
    try {
      const userId = getUserId(req);
      const invoice = await invoiceService.settleInvoiceBalance(
        req.params.id,
        userId,
      );
      return res.json({
        message: "Invoice marked as PAID successfully",
        invoice,
      });
    } catch (error) {
      return sendError(res, error, "settle invoice failed");
    }
  },
);

// =========================================================================
// ANALYTICS
// =========================================================================
app.get(
  "/api/analytics/overview",
  authenticateToken,
  checkSubscription,
  async (req, res) => {
    try {
      const metrics = await analyticsRepository.getOverviewMetrics(
        getUserId(req),
      );
      return res.json({
        message: "Analytics calculations computed successfully!",
        data: metrics,
      });
    } catch (error) {
      return sendError(res, error, "analytics failed");
    }
  },
);

// =========================================================================
// INVOICE PDF
// =========================================================================
app.get(
  "/api/invoices/:id/pdf",
  authenticateToken,
  checkSubscription,
  async (req, res) => {
    try {
      const userId = getUserId(req);
      const invoiceId = Number(req.params.id);
      if (!Number.isInteger(invoiceId) || invoiceId < 1) {
        throw new AppError("Invalid invoice id", 400);
      }

      const invoiceResult = await pool.query(
        `SELECT i.*, c.name AS client_name, c.email AS client_email, c.phone_number AS client_phone
       FROM invoices i
       JOIN clients c ON c.id = i.client_id AND c.user_id = i.user_id
       WHERE i.id = $1 AND i.user_id = $2`,
        [invoiceId, userId],
      );
      const invoice = invoiceResult.rows[0];
      if (!invoice) throw new AppError("Invoice not found", 404);

      const itemsResult = await pool.query(
        "SELECT description, quantity, unit_amount_cents FROM invoice_items WHERE invoice_id = $1 ORDER BY id",
        [invoiceId],
      );

      const ownerResult = await pool.query(
        "SELECT username, email FROM users WHERE id = $1",
        [userId],
      );
      const owner = ownerResult.rows[0] || {};

      // The generator sets the PDF headers and streams the file
      generateInvoicePdfStream(res, invoice, itemsResult.rows, {
        name: owner.username,
        email: owner.email,
      });
    } catch (error) {
      if (!res.headersSent) return sendError(res, error, "pdf failed");
      res.end();
    }
  },
);

// =========================================================================
// AI AGENT: tool definitions
// The model only PROPOSES actions. Nothing is written until the user confirms.
// =========================================================================
const aiTools = [
  {
    functionDeclarations: [
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

// =========================================================================
// AI AGENT: chat (proposes an action or answers)
// =========================================================================
app.post(
  "/api/chat",
  authenticateToken,
  checkSubscription,
  async (req, res) => {
    try {
      const activeUserId = getUserId(req);
      const { message } = req.body;

      if (typeof message !== "string" || message.trim() === "") {
        throw new AppError("Message content cannot be blank.", 400);
      }
      if (message.length > 2000) {
        throw new AppError("Message is too long (max 2000 characters).", 400);
      }

      // Exact-match menu request only, so "help me create an invoice" still reaches the model
      const normalized = message.toLowerCase().trim().replace(/[?!.]/g, "");
      const menuRequests = [
        "help",
        "menu",
        "what can you do",
        "capabilities",
        "features",
        "options",
      ];
      if (menuRequests.includes(normalized)) {
        return res.json({
          type: "action_deck",
          message:
            "Welcome to your active LedgerFlow workspace hub. Click an action card helper below or input a standard text prompt to execute autonomous system directives hands-free:",
          data: {},
        });
      }

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: message,
        config: { tools: aiTools },
      });

      const functionCall = response.functionCalls?.[0];

      if (functionCall) {
        const toolName = functionCall.name;
        const args = functionCall.args || {};
        console.log(`[AI AGENT] model selected tool: ${toolName}`);

        // Propose: create a client
        if (toolName === "registerNewClient") {
          return res.json({
            type: "approval_required",
            action: "create_client",
            message: `I've prepared a draft to register **${args.name}** (${args.email}) as a new customer. Please confirm to save.`,
            data: { name: args.name, email: args.email },
          });
        }

        // Propose: create an invoice (never invents an amount, client, or number)
        if (toolName === "draftNewInvoice") {
          const items =
            Array.isArray(args.items) && args.items.length
              ? args.items
              : args.amountCents
                ? [
                    {
                      description: args.description || "Services",
                      quantity: 1,
                      price: args.amountCents / 100,
                    },
                  ]
                : null;

          if (!items) {
            return res.json({
              type: "text",
              message:
                "What amount (or line items) should this invoice be for?",
            });
          }

          const totalCents = items.reduce(
            (sum, it) =>
              sum +
              Math.round(Number(it.price) * 100) * Number(it.quantity || 1),
            0,
          );

          return res.json({
            type: "approval_required",
            action: "create_invoice",
            message: `I've drafted an invoice for Client ID **#${args.clientId}** totaling **$${(totalCents / 100).toFixed(2)}**, due **${args.dueDate}**. The invoice number is assigned when it's created. Proceed?`,
            data: {
              client_id: Number(args.clientId),
              due_date: args.dueDate,
              items,
            },
          });
        }

        // Propose: mark an invoice paid
        if (toolName === "settleInvoiceBalance") {
          return res.json({
            type: "approval_required",
            action: "settle_invoice",
            message: `I've located Invoice ID **#${args.invoiceId}**. Would you like me to mark it as paid?`,
            data: { invoiceId: Number(args.invoiceId) },
          });
        }

        // Read-only: business metrics (no confirmation needed)
        if (toolName === "calculateBusinessMetrics") {
          const metrics =
            await analyticsRepository.getOverviewMetrics(activeUserId);
          const briefResponse = await ai.models.generateContent({
            model: GEMINI_SUMMARY_MODEL,
            contents: `Express these business statistics to the user in a short, motivating executive summary text paragraph: ${JSON.stringify(metrics)}`,
          });
          return res.json({ type: "text", message: briefResponse.text });
        }
      }

      // No tool call: return the model's plain reply
      return res.json({ type: "text", message: response.text });
    } catch (error) {
      if (error instanceof AppError)
        return sendError(res, error, "chat failed");

      const msg = String(error?.message || "");
      if (msg.includes("503") || msg.includes("UNAVAILABLE")) {
        return res.status(200).json({
          type: "text",
          message:
            "My language processor is experiencing heavy traffic right now. Please try again in a few moments!",
        });
      }

      console.error("AI chat failed:", error);
      return res
        .status(500)
        .json({ error: "Failed to process conversational agent request." });
    }
  },
);

// =========================================================================
// AI AGENT: confirm (runs the approved action through the normal services)
// =========================================================================
app.post(
  "/api/chat/confirm",
  authenticateToken,
  checkSubscription,
  async (req, res) => {
    try {
      const userId = getUserId(req);
      const { action, data } = req.body;

      if (!action || typeof data !== "object" || data === null) {
        throw new AppError("Missing confirmation payload", 400);
      }

      if (action === "create_client") {
        const client = await clientService.registerClient(
          userId,
          data.name,
          data.email,
          data.phone_number,
        );
        return res.json({ message: `Client '${client.name}' created.` });
      }

      if (action === "create_invoice") {
        const invoice = await invoiceService.createFullInvoice(
          userId,
          data.client_id,
          data.invoice_number,
          data.due_date,
          data.items,
        );
        return res.json({
          message: `Invoice ${invoice.invoice_number} created with ${invoice.items.length} line item(s).`,
        });
      }

      if (action === "settle_invoice") {
        const invoice = await invoiceService.settleInvoiceBalance(
          data.invoiceId,
          userId,
        );
        return res.json({
          success: true,
          message: `Invoice ${invoice.invoice_number} marked as PAID.`,
        });
      }

      throw new AppError(`Unsupported action '${action}'`, 400);
    } catch (error) {
      return sendError(res, error, "confirm failed");
    }
  },
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[LEDGERFLOW] API running on port ${PORT}`);
});
