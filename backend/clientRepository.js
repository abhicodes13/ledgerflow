const pool = require("./db");

const CLIENT_COLUMNS =
  "id, user_id, name, email, phone_number, sms_opt_out, archived_at, created_at";

// `db` defaults to the pool; pass a transaction client to run inside a transaction.
const clientRepository = {
  async create(activeUserId, name, email, phoneNumber = null, db = pool) {
    const result = await db.query(
      `INSERT INTO clients (user_id, name, email, phone_number)
       VALUES ($1, $2, $3, $4)
       RETURNING ${CLIENT_COLUMNS}`,
      [activeUserId, name, email, phoneNumber],
    );
    return result.rows[0];
  },

  async findByEmail(activeUserId, email, db = pool) {
    const result = await db.query(
      `SELECT ${CLIENT_COLUMNS} FROM clients WHERE user_id = $1 AND email = $2`,
      [activeUserId, email],
    );
    return result.rows[0];
  },

  async findById(activeUserId, clientId, db = pool) {
    const result = await db.query(
      `SELECT ${CLIENT_COLUMNS} FROM clients WHERE user_id = $1 AND id = $2`,
      [activeUserId, clientId],
    );
    return result.rows[0];
  },

  async findAll(activeUserId, db = pool) {
    const result = await db.query(
      `SELECT ${CLIENT_COLUMNS} FROM clients
       WHERE user_id = $1 AND archived_at IS NULL
       ORDER BY name`,
      [activeUserId],
    );
    return result.rows;
  },
};

module.exports = clientRepository;
