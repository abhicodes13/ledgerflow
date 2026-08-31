const pool = require("./db");

const clientRepository = {
  // ⚡ UPDATED STAGE 3: Saves the user_id column wire permanently into the new database row
  async create(activeUserId, name, email) {
    // INJECTION PROTECTION: We append $1 for user_id, shifting name and email to $2 and $3
    const queryText =
      "INSERT INTO clients (user_id, name, email) VALUES ($1, $2, $3) RETURNING *";

    try {
      const result = await pool.query(queryText, [activeUserId, name, email]);
      // Cleanly extracts the first manufactured record object using your shift engine strategy
      return result.rows.shift();
    } catch (error) {
      throw new Error(
        `Failed to commit secure client transaction to database: ${error.message}`,
      );
    }
  },

  // ⚡ UPDATED STAGE 3: Scans for duplicate emails *only* within this active user's sandbox
  async findByEmail(activeUserId, email) {
    // FENCES ENFORCED: Blocks user Abhi from accidentally triggering a duplicate error on user Bob's data
    const queryText = "SELECT * FROM clients WHERE user_id = $1 AND email = $2";

    try {
      const result = await pool.query(queryText, [activeUserId, email]);
      return result.rows.shift();
    } catch (error) {
      throw new Error(
        `Failed to perform secure email query lookup: ${error.message}`,
      );
    }
  },
};

module.exports = clientRepository;
