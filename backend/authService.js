const pool = require("./db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "LEDGERFLOW_MASTER_SECURE_TOKEN_SALT_999";

const authService = {
  // 1. REGISTRATION GATEKEEPER
  async register(username, rawPassword) {
    if (!username || !rawPassword) {
      throw new Error("Username and password are required credentials");
    }

    const cleanUser = username.trim();
    const cleanPass = rawPassword.trim();

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(cleanPass, salt);

    const queryText = `INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at;`;

    try {
      const result = await pool.query(queryText, [cleanUser, passwordHash]);
      return result.rows[0];
    } catch (error) {
      if (error.code === "23505") {
        throw new Error("This username is already occupied");
      }
      throw error;
    }
  },

  // 2. LOGIN GATEKEEPER
  async login(username, rawPassword) {
    if (!username || !rawPassword) {
      throw new Error("Username and password are required credentials");
    }

    const cleanUser = username.trim();
    const cleanPass = rawPassword.trim();

    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1;",
      [cleanUser],
    );
    const user = result.rows[0];

    if (!user) {
      throw new Error("Invalid username provided");
    }

    const isMatch = await bcrypt.compare(cleanPass, user.password_hash);
    if (!isMatch) {
      throw new Error("Invalid password");
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    return { token, user: { id: user.id, username: user.username } };
  },
};

module.exports = authService;
