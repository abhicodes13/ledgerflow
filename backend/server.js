// =========================================================================
// LEDGERFLOW API SERVER
// =========================================================================
require("dotenv").config(); // must stay first so .env is loaded before other files read it
const required = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "JWT_SECRET",
  "RESEND_API_KEY",
  "FRONTEND_PRODUCTION_URL",
];
for (const k of required)
  if (!process.env[k]) throw new Error(`Missing env var: ${k}`);
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const pool = require("./db");
const clientService = require("./clientService");
const invoiceService = require("./invoiceService");
const analyticsRepository = require("./analyticsRepository");
const reminderService = require("./reminderService");
const agent = require("./agent");
const authService = require("./authService");
const authenticateToken = require("./authMiddleware");
const checkSubscription = require("./subscriptionMiddleware"); // paywall: use AFTER authenticateToken
const paymentRouter = require("./payment");
const { AppError } = require("./errors");
const { generateInvoicePdfStream } = require("./utils/invoiceGenerator");

const app = express();
const PORT = process.env.PORT || 3000;

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
  process.env.FRONTEND_PRODUCTION_URL,
  ...(process.env.NODE_ENV !== "production"
    ? ["http://localhost:5173", "http://localhost:3000"]
    : []),
].filter(Boolean);
app.set("trust proxy", 1);
app.use(helmet());
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
// REMINDERS (email). The preview stores exactly what will be sent;
// only confirming sends it.
// =========================================================================
app.post(
  "/api/reminders/preview",
  authenticateToken,
  checkSubscription,
  async (req, res) => {
    try {
      const userId = getUserId(req);
      const { channel, invoice_ids } = req.body;
      if (channel && channel !== "email") {
        throw new AppError(
          "Only email reminders are supported right now.",
          400,
        );
      }
      const preview = await reminderService.previewReminders(userId, {
        invoiceIds: invoice_ids,
      });
      return res.json({ success: true, ...preview });
    } catch (error) {
      return sendError(res, error, "reminder preview failed");
    }
  },
);

app.post(
  "/api/reminders/:id/confirm",
  authenticateToken,
  checkSubscription,
  async (req, res) => {
    try {
      const userId = getUserId(req);
      const result = await reminderService.confirmReminders(
        userId,
        req.params.id,
      );
      return res.json({ success: true, ...result });
    } catch (error) {
      return sendError(res, error, "reminder confirm failed");
    }
  },
);

// =========================================================================
// AI AGENT: chat. The model can look things up and propose actions; it never
// changes data. Writes only happen in /api/chat/confirm after the user approves.
// =========================================================================
app.post(
  "/api/chat",
  authenticateToken,
  checkSubscription,
  async (req, res) => {
    try {
      const userId = getUserId(req);
      const { message, history } = req.body;

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

      // history (optional): [{ role: "user" | "assistant", text: "..." }, ...]
      const reply = await agent.run({
        userId,
        message: message.trim(),
        history,
      });
      return res.json(reply);
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

      if (action === "send_reminders") {
        // The browser only sends back an id; the recipients were stored on the server
        const result = await reminderService.confirmReminders(
          userId,
          data.pendingActionId,
        );
        return res.json({
          success: true,
          message: `Sent ${result.sent} reminder email(s)${result.failed ? `, ${result.failed} failed` : ""}.`,
          results: result.results,
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
