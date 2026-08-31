const pool = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "LEDGERFLOW_MASTER_SECURE_TOKEN_SALT_999";

const authService = {
  async register(username, rawPassword) {
    if (!username || !rawPassword) {
      throw new Error("Username and password are required credentials");
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    const queryText = `INSERT INTO users (username,password_hash) VALUES ($1,$2) RETURNING id, username,created_at`;
    try {
      const result = await pool.query(queryText, [username, passwordHash]);
      return result.rows[0];
    } catch (error) {
      if (error.code === "23505") {
        throw new Error("this username is already occupied");
      }
      throw error;
    }
  },

  async login(username, rawPassword) {
    if (!username || rawPassword) {
      throw new Error("Username and password are required");
    }
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1;",
      [username],
    );
    const user = result.rows[0];

    if (!user) throw new Error("Invalid username provided");
    const isMatch = await bcrypt.compare(rawPassword, user.password_hash);
    if (!isMatch) throw new Error("Invalid password");
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" },
    );
    return { token, user: { id: user.id, username: user.username } };
  },
};

module.exports = authService;
