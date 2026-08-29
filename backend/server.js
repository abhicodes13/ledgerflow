const express = require("express");
const pool = require("./db");
const clientService = require("./clientService");

const app = express();
const PORT = 3000;

app.use(express.json());

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

app.post("/api/clients", async (req, res) => {
  console.log("📥 Arrived at Controller:", req.body);
  const { name, email } = req.body;

  if (!name || !email) {
    return res
      .status(400)
      .json({ error: "Name and email are required fields." });
  }

  try {
    const newClient = await clientService.registerClient(name, email);
    console.log("📤 Sending back to client:", newClient); // Debug logger

    return res.status(201).json({
      message: "Client created successfully",
      client: newClient,
    });
  } catch (error) {
    if (error.code === "DUPLICATE_EMAIL") {
      return res.status(409).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error occurred." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server active on http://localhost:${PORT}`);
});
