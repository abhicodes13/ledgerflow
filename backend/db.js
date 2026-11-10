const { Pool, types } = require("pg");
types.setTypeParser(1082, (value) => value); // keep DATE columns as "2026-12-31" strings
// Automatically load variables from a .env file if it exists
require("dotenv").config();

// If a single cloud connection string (like Neon) is present, use it.
// Otherwise, fall back to the individual local variables.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost")
        ? false
        : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  : new Pool({
      user: process.env.DB_USER || "postgres",
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "ledgerflow_db",
      password: process.env.DB_PASSWORD || "password123",
      port: process.env.DB_PORT || 5433,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

module.exports = pool;
