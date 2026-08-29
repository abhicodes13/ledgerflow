const pool = require("./db");

const clientRepository = {
  // Save a brand new client to the database
  async create(name, email) {
    const queryText =
      "INSERT INTO clients (name, email) VALUES ($1, $2) RETURNING *";
    const result = await pool.query(queryText, [name, email]);

    // Pick the absolute first created item row out of the array list
    return result.rows.shift();
  },

  // Look up an existing client by their email address
  async findByEmail(email) {
    const queryText = "SELECT * FROM clients WHERE email = $1";
    const result = await pool.query(queryText, [email]);

    // Pick the first found client matching this email out of the list
    return result.rows.shift();
  },
};

module.exports = clientRepository;
