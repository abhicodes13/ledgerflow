const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "ledgerflow_db",
  password: "password123",
  port: "5433",

  // 🛡️ THE CONNECTION POOL UPGRADE (Add this locally too!) [2.1]
  max: 10, // Caps local simultaneous connections to 10
  idleTimeoutMillis: 30000, // Close local idle connections after 30s
  connectionTimeoutMillis: 2000, // Error out if a query waits over 2s
});

module.exports = pool;
