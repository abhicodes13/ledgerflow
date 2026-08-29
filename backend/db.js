const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "ledgerflow_db",
  password: "password123",
  port: "5433",
});

module.exports = pool;
