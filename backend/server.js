const express = require("express");
const pool = require("./db");

const app = express();

const PORT = 3000;

app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    const dbResult = await pool.query("SELECT NOW()");
    res.json({
      status: "healthy",
      message: "server is running perfectly",
      database_time: dbResult.rows[0].now,
    });
  } catch (error) {
    console.error("db connection failed:", error.message);
    res.status(500).json({
      status: "unhealthy",
      message: "server engine is active but database link failed",
    });
  }
});

app.post("/api/clients", async (req, res) => {
  console.log("📥 Incoming Data Payload:", req.body);
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email required" });
  }
  try {
    const queryText =
      "INSERT INTO clients (name,email) VALUES ($1,$2) RETURNING *";
    const values = [name, email];
    const result = await pool.query(queryText, values);

    res.status(201).json({
      message: "Client created successfully",
      client: result.rows[0],
    });
  } catch (error) {
    console.log("failed to save client", error);
    if (error.code === "23505") {
      return res.status(409).json({ error: "A client with this email exists" });
    }
    res.status(500).json({ error: "Internal server error while saving data." });
  }
});
app.listen(PORT, () => {
  console.log(`Server is listening on PORT ${PORT}`);
});
